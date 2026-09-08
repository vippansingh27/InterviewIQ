import fs from "fs/promises";
import { existsSync } from "fs";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

import { askAi } from "../services/openRouter.service.js";
import User from "../models/user.model.js";
import Interview from "../models/interview.model.js";

// =====================================================
// ANALYZE RESUME
// =====================================================

export const analyzeResume = async (req, res) => {
    let filepath;

    try {
        // Check if resume was uploaded
        if (!req.file) {
            return res.status(400).json({
                message: "Resume Required"
            });
        }

        filepath = req.file.path;

        // Read PDF file
        const fileBuffer = await fs.readFile(filepath);

        const uint8Array = new Uint8Array(fileBuffer);

        // Load PDF
        const pdf = await pdfjsLib.getDocument({
            data: uint8Array
        }).promise;

        let resumeText = "";

        // Extract text from every page
        for (
            let pageNum = 1;
            pageNum <= pdf.numPages;
            pageNum++
        ) {
            const page = await pdf.getPage(pageNum);

            const content = await page.getTextContent();

            const pageText = content.items
                .map((item) => item.str)
                .join(" ");

            resumeText += pageText + "\n";
        }

        resumeText = resumeText
            .replace(/\s+/g, " ")
            .trim();

        console.log("Resume Text:", resumeText);

        // AI prompt
        const messages = [
            {
                role: "system",
                content: `
Extract structured data from the resume.

Return STRICTLY valid JSON.
Do not include markdown.
Do not include \`\`\`json.

Format:

{
    "role": "string",
    "experience": "string",
    "projects": ["project1", "project2"],
    "skills": ["skill1", "skill2"]
}
                `
            },
            {
                role: "user",
                content: resumeText
            }
        ];

        // Send resume to AI
        const aiResponse = await askAi(messages);

        console.log("AI Response:", aiResponse);

        // Parse AI response
        const parsed = JSON.parse(aiResponse);

        // Delete uploaded file
        if (existsSync(filepath)) {
            await fs.unlink(filepath);
        }

        // Send response
        return res.status(200).json({
            role: parsed.role || "",
            experience: parsed.experience || "",
            projects: parsed.projects || [],
            skills: parsed.skills || [],
            resumeText
        });

    } catch (error) {

        console.error(
            "ANALYZE RESUME ERROR:",
            error
        );

        // Delete file if something went wrong
        if (filepath && existsSync(filepath)) {
            try {
                await fs.unlink(filepath);
            } catch (deleteError) {
                console.error(
                    "Error deleting uploaded file:",
                    deleteError
                );
            }
        }

        return res.status(500).json({
            message: error.message
        });
    }
};


// =====================================================
// GENERATE QUESTIONS
// =====================================================

export const generateQuestion = async (req, res) => {
    try {

        let {
            role,
            experience,
            mode,
            resumeText,
            projects,
            skills
        } = req.body;

        // ---------------------------------------------
        // Clean input
        // ---------------------------------------------

        role = role?.trim();
        experience = experience?.trim();
        mode = mode?.trim();

        // ---------------------------------------------
        // Validate input
        // ---------------------------------------------

        if (!role || !experience || !mode) {
            return res.status(400).json({
                message:
                    "Role, Experience and Mode are required."
            });
        }

        // ---------------------------------------------
        // Find logged-in user
        // IMPORTANT FIX:
        // req.userId instead of req,userId
        // ---------------------------------------------

        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        // ---------------------------------------------
        // Check credits
        // ---------------------------------------------

        if (user.credits < 10) {
            return res.status(400).json({
                message:
                    "Not enough credits. Minimum 10 credits required."
            });
        }

        // ---------------------------------------------
        // Prepare resume data
        // ---------------------------------------------

        const projectText =
            Array.isArray(projects) && projects.length
                ? projects.join(", ")
                : "None";

        const skillsText =
            Array.isArray(skills) && skills.length
                ? skills.join(", ")
                : "None";

        const safeResume =
            resumeText?.trim() || "None";

        // ---------------------------------------------
        // Create AI prompt
        // ---------------------------------------------

        const userPrompt = `
Role: ${role}
Experience: ${experience}
InterviewMode: ${mode}
Projects: ${projectText}
Skills: ${skillsText}
Resume: ${safeResume}
`;

        if (!userPrompt.trim()) {
            return res.status(400).json({
                message: "Prompt content is empty."
            });
        }

        // ---------------------------------------------
        // AI messages
        // ---------------------------------------------

        const messages = [
            {
                role: "system",
                content: `
You are a real human interviewer conducting a professional interview.

Speak in simple, natural Indian English as if you are directly talking to the candidate.

Generate exactly 10 interview questions.

Strict Rules:

- Each question must contain between 15 and 25 words.
- Each question must be a single complete sentence.
- Do NOT number them.
- Do NOT add explanations.
- Do NOT add extra text before or after.
- One question per line only.
- Keep language simple and conversational.
- Questions must feel practical and realistic.
- Ask important questions related to the candidate's projects and skills.
- Questions should also be relevant to the candidate's role and experience.

Difficulty progression:

Question 1 -> easy
Question 2 -> easy
Question 3 -> easy
Question 4 -> easy
Question 5 -> medium
Question 6 -> medium
Question 7 -> medium
Question 8 -> hard
Question 9 -> hard
Question 10 -> hard

Make questions based on:

- candidate role
- experience
- projects
- skills
- interview mode
- resume details
                `
            },
            {
                role: "user",
                content: userPrompt
            }
        ];

        // ---------------------------------------------
        // Ask AI
        // ---------------------------------------------

        const aiResponse = await askAi(messages);

        if (!aiResponse || !aiResponse.trim()) {
            return res.status(500).json({
                message: "AI returned empty response."
            });
        }

        console.log(
            "Generated Questions:",
            aiResponse
        );

        // ---------------------------------------------
        // Convert AI response to array
        // ---------------------------------------------

        const questionsArray = aiResponse
            .split("\n")
            .map((q) => q.trim())
            .filter((q) => q.length > 0)
            .slice(0, 10);

        // IMPORTANT:
        // We now keep 10 questions instead of 5.

        if (questionsArray.length === 0) {
            return res.status(500).json({
                message:
                    "AI failed to generate questions."
            });
        }

        // ---------------------------------------------
        // Make sure we have enough questions
        // ---------------------------------------------

        if (questionsArray.length < 10) {
            return res.status(500).json({
                message:
                    `AI generated only ${questionsArray.length} questions. Expected 10.`
            });
        }

        // ---------------------------------------------
        // Deduct credits
        // ---------------------------------------------

        user.credits -= 10;

        await user.save();

        // ---------------------------------------------
        // Create interview
        // ---------------------------------------------

        const interview = await Interview.create({
            userId: user._id,

            role,

            experience,

            mode,

            resumeText: safeResume,

            questions: questionsArray.map(
                (q, index) => ({
                    question: q,

                    difficulty: [
                        "easy",
                        "easy",
                        "easy",
                        "easy",
                        "medium",
                        "medium",
                        "medium",
                        "hard",
                        "hard",
                        "hard"
                    ][index],

                    timeLimit: [
                        60,
                        60,
                        60,
                        60,
                        90,
                        90,
                        90,
                        120,
                        120,
                        120
                    ][index]
                })
            )
        });

        // ---------------------------------------------
        // Send response
        // ---------------------------------------------

        return res.status(200).json({
            interviewId: interview._id,

            creditsLeft: user.credits,

            userName: user.name,

            questions: interview.questions
        });

    } catch (error) {

        console.error(
            "GENERATE QUESTION ERROR:",
            error
        );

        return res.status(500).json({
            message:
                `Failed to create Interview: ${error.message}`
        });
    }
};


// =====================================================
// SUBMIT ANSWER
// =====================================================

export const submitAnswer = async (req, res) => {
    try {

        const {
            interviewId,
            questionIndex,
            answer,
            timeTaken
        } = req.body;

        // ---------------------------------------------
        // Validate interview ID
        // ---------------------------------------------

        if (!interviewId) {
            return res.status(400).json({
                message: "Interview ID is required."
            });
        }

        // ---------------------------------------------
        // Find interview
        // ---------------------------------------------

        const interview =
            await Interview.findById(interviewId);

        if (!interview) {
            return res.status(404).json({
                message: "Interview not found."
            });
        }

        // ---------------------------------------------
        // Validate question index
        // ---------------------------------------------

        if (
            questionIndex === undefined ||
            questionIndex === null ||
            !interview.questions[questionIndex]
        ) {
            return res.status(400).json({
                message: "Invalid question index."
            });
        }

        const question =
            interview.questions[questionIndex];

        // ---------------------------------------------
        // If no answer
        // ---------------------------------------------

        if (!answer || !answer.trim()) {

            question.score = 0;
            question.confidence = 0;
            question.communication = 0;
            question.correctness = 0;
            question.feedback = "You did not submit an answer.";
            question.answer = "";

            await interview.save();

            return res.status(200).json({
                success: true,
                feedback: question.feedback,
                score: 0,
                confidence: 0,
                communication: 0,
                correctness: 0,
            });
        }

        // ---------------------------------------------
        // If time exceeded
        // ---------------------------------------------

        if (
            timeTaken !== undefined &&
            timeTaken > question.timeLimit
        ) {

            question.score = 0;
            question.confidence = 0;
            question.communication = 0;
            question.correctness = 0;
            question.feedback =
                "Time limit exceeded. Answer not evaluated.";
            question.answer = answer;

            await interview.save();

            return res.status(200).json({
                success: true,
                feedback: question.feedback,
                score: 0,
                confidence: 0,
                communication: 0,
                correctness: 0,
            });
        }

        // ---------------------------------------------
        // AI evaluation
        // ---------------------------------------------

        const messages = [
            {
                role: "system",
                content: `
You are a professional human interviewer evaluating a candidate's answer in a real interview.

Evaluate naturally and fairly, like a real person would.

Score the answer in these areas from 0 to 10:

1. Confidence
Does the answer sound clear, confident, and well-presented?

2. Communication
Is the language simple, clear, and easy to understand?

3. Correctness
Is the answer accurate, relevant, and complete?

Rules:

- Be realistic and unbiased.
- Do not give random high scores.
- If the answer is weak, score low.
- If the answer is strong and detailed, score high.
- Consider clarity, structure, and relevance.

Calculate:

finalScore = average of confidence,
communication, and correctness.

Round finalScore to the nearest whole number.

Feedback Rules:

- Write natural human feedback.
- 10 to 15 words only.
- Sound like real interview feedback.
- Suggest improvement if needed.
- Do NOT repeat the question.
- Do NOT explain scoring.
- Keep tone professional and honest.

Return ONLY valid JSON.

Format:

{
    "confidence": number,
    "communication": number,
    "correctness": number,
    "finalScore": number,
    "feedback": "short human feedback"
}
`
            },
            {
                role: "user",
                content: `
Question: ${question.question}

Answer: ${answer}
`
            }
        ];

        // ---------------------------------------------
        // Ask AI
        // ---------------------------------------------

        const aiResponse =
            await askAi(messages);

        console.log(
            "Answer Evaluation:",
            aiResponse
        );

        // ---------------------------------------------
        // Parse AI response
        // ---------------------------------------------

        const parsed =
            JSON.parse(aiResponse);

        // ---------------------------------------------
        // Save evaluation
        // ---------------------------------------------

        question.answer = answer;

        question.confidence =
            parsed.confidence;

        question.communication =
            parsed.communication;

        question.correctness =
            parsed.correctness;

        question.score =
            parsed.finalScore;

        question.feedback =
            parsed.feedback;

        await interview.save();

        // ---------------------------------------------
        // Send score + feedback to frontend
        // ---------------------------------------------

        return res.status(200).json({
            success: true,
            feedback: parsed.feedback,
            score: parsed.finalScore,
            confidence: parsed.confidence,
            communication: parsed.communication,
            correctness: parsed.correctness,
        });

    } catch (error) {

        console.error(
            "SUBMIT ANSWER ERROR:",
            error
        );

        return res.status(500).json({
            message:
                `Failed to submit answer: ${error.message}`
        });
    }
};
// =====================================================
// FINISH INTERVIEW
// =====================================================

export const finishInterview = async (req, res) => {
    try {

        const {
            interviewId
        } = req.body;

        // ---------------------------------------------
        // Validate interview ID
        // ---------------------------------------------

        if (!interviewId) {
            return res.status(400).json({
                message:
                    "Interview ID is required."
            });
        }

        // ---------------------------------------------
        // Find interview
        // ---------------------------------------------

        const interview =
            await Interview.findById(interviewId);

        if (!interview) {
            return res.status(404).json({
                message:
                    "Interview not found."
            });
        }

        // ---------------------------------------------
        // Calculate scores
        // ---------------------------------------------

        const totalQuestions =
            interview.questions.length;

        let totalScore = 0;

        let totalConfidence = 0;

        let totalCommunication = 0;

        let totalCorrectness = 0;

        interview.questions.forEach((q) => {

            totalScore += q.score || 0;

            totalConfidence +=
                q.confidence || 0;

            totalCommunication +=
                q.communication || 0;

            totalCorrectness +=
                q.correctness || 0;
        });

        // ---------------------------------------------
        // Calculate averages
        // ---------------------------------------------

        const finalScore =
            totalQuestions
                ? totalScore / totalQuestions
                : 0;

        const avgConfidence =
            totalQuestions
                ? totalConfidence / totalQuestions
                : 0;

        const avgCommunication =
            totalQuestions
                ? totalCommunication / totalQuestions
                : 0;

        const avgCorrectness =
            totalQuestions
                ? totalCorrectness / totalQuestions
                : 0;

        // ---------------------------------------------
        // Update interview
        // ---------------------------------------------

        interview.finalScore =
            finalScore;

        interview.status =
            "completed";

        await interview.save();

        // ---------------------------------------------
        // Return result
        // ---------------------------------------------

        return res.status(200).json({

            finalScore:
                Number(finalScore.toFixed(1)),

            confidence:
                Number(
                    avgConfidence.toFixed(1)
                ),

            communication:
                Number(
                    avgCommunication.toFixed(1)
                ),

            correctness:
                Number(
                    avgCorrectness.toFixed(1)
                ),

            questionWiseScores:
                interview.questions.map(
                    (q) => ({
                        question: q.question,

                        score: q.score || 0,

                        feedback:
                            q.feedback || "",

                        confidence:
                            q.confidence || 0,

                        communication:
                            q.communication || 0,

                        correctness:
                            q.correctness || 0
                    })
                )
        });

    } catch (error) {

        console.error(
            "FINISH INTERVIEW ERROR:",
            error
        );

        return res.status(500).json({
            message:
                `Failed to finish Interview: ${error.message}`
        });
    }
};

export const getMyInterview = async (req, res) => {
  try {
    const interviews = await Interview.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .select("role experience mode finalScore status createdAt");

    return res.status(200).json({
      interviews,
    });
  } catch (error) {
    return res.status(500).json({
      message: `failed to find currentUser Interview ${error}`,
    });
  }
};

export const getInterviewReport = async(req,res)=>{
    try{
        const interview = await Interview.findById(req.params.id)
        if(!interview){
            return res.status(400).json({message:"Interview not found"});
        }

        const totalQuestions = interview.questions.length;
            let totalConfidence = 0;
            let totalCommunication = 0;
            let totalCorrectness = 0;

        interview.questions.forEach((q) => {
    totalConfidence +=q.confidence || 0;
    totalCommunication +=q.communication || 0;
    totalCorrectness +=q.correctness || 0;
        });
        const avgConfidence =totalQuestions? totalConfidence / totalQuestions: 0;
        const avgCommunication =totalQuestions ? totalCommunication / totalQuestions : 0;
        const avgCorrectness = totalQuestions ? totalCorrectness / totalQuestions : 0;
        return res.json({
            finalScore:interview.finalScore,
            confidence:Number(avgConfidence.toFixed(1)),
            communication:Number(avgCommunication.toFixed(1)),
            correctness:Number(avgCorrectness.toFixed(1)),
            questionWiseScores:interview.questions
        })

    }catch(error){
        return res.status(500).json({message:`failed to find currentUser Interview ${error}`})
    }
}