import React, { useEffect, useRef, useState } from "react";
import maleVideo from "../assets/Videos/male-ai.mp4";
import femaleVideo from "../assets/Videos/female-ai.mp4";
import Timer from "./Timer";
import { motion } from "motion/react";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import { BsArrowRight } from "react-icons/bs";
import axios from "axios";

const ServerUrl =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

function Step2Interview({ interviewData, onFinish }) {
  const { interviewId, questions, userName } = interviewData;

  const [isIntroPhase, setIsIntroPhase] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isAIPlaying, setIsAIPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [voiceGender, setVoiceGender] = useState("female");
  const [subtitle, setSubtitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const recognitionRef = useRef(null);
  const videoRef = useRef(null);

  const currentQuestion = questions[currentIndex];

  const [timeLeft, setTimeLeft] = useState(
    currentQuestion?.timeLimit || 60
  );

  /* ---------------------- Load Female Voice ---------------------- */

 /* ---------------------- Load Female Voice (macOS) ---------------------- */

useEffect(() => {
  const loadVoices = () => {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return;

    // macOS Female Voices (priority order)
    const femaleVoice =
      voices.find(v => v.name === "Samantha") ||
      voices.find(v => v.name === "Ava") ||
      voices.find(v => v.name === "Karen") ||
      voices.find(v => v.name === "Moira") ||
      voices.find(v => v.name === "Tessa") ||
      voices.find(v => v.name === "Victoria") ||
      voices.find(v => v.name === "Serena") ||
      voices.find(v => v.name.toLowerCase().includes("samantha")) ||
      voices.find(v => v.name.toLowerCase().includes("ava")) ||
      voices.find(v => v.name.toLowerCase().includes("karen")) ||
      voices.find(v => v.name.toLowerCase().includes("moira"));

    // Always select a female voice if found
    setSelectedVoice(femaleVoice || voices[0]);

    // Always keep female avatar
    setVoiceGender("female");
  };

  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;

  return () => {
    window.speechSynthesis.onvoiceschanged = null;
  };
}, []);

  // const videoSource = voiceGender === "female" ? femaleVideo : maleVideo;
  const videoSource = femaleVideo;

  /* ---------------------- Speech Function ---------------------- */

  const speakText = (text) => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis || !selectedVoice) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(
        text.replace(/,/g, ", ... ").replace(/\./g, ". ... ")
      );

utterance.voice = selectedVoice;
utterance.lang = "en-US";
utterance.rate = 0.92;
utterance.pitch = 1.35; // Better female tone on macOS
utterance.volume = 1;
      utterance.onstart = () => {
        setSubtitle(text);
        setIsAIPlaying(true);
        stopMic();
        videoRef.current?.play();
      };

      utterance.onend = () => {
        videoRef.current?.pause();
        if (videoRef.current) videoRef.current.currentTime = 0;

        setSubtitle("");
        setIsAIPlaying(false);

        if (isMicOn) startMic();

        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  };

  /* ---------------------- Intro + Question ---------------------- */

  useEffect(() => {
    if (!selectedVoice) return;

    const runIntro = async () => {
      if (isIntroPhase) {
        await speakText(
          `Hi ${userName}, it's great to meet you today. I hope you're feeling confident and ready.`
        );

        await speakText(
          "I'll ask you a few interview questions. Just answer naturally and take your time. Let's begin."
        );

        setIsIntroPhase(false);
      } else if (currentQuestion) {
        await new Promise((r) => setTimeout(r, 700));

        if (currentIndex === questions.length - 1) {
          await speakText(
            "Alright, this is the final question. Give it your best shot."
          );
        }

        await speakText(currentQuestion.question);
      }
    };

    runIntro();
  }, [selectedVoice, isIntroPhase, currentIndex]);

  /* ---------------------- Timer ---------------------- */

  useEffect(() => {
    if (isIntroPhase || !currentQuestion) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isIntroPhase, currentIndex]);

  useEffect(() => {
    if (!isIntroPhase && currentQuestion) {
      setTimeLeft(currentQuestion.timeLimit || 60);
    }
  }, [currentIndex]);

  /* ---------------------- Speech Recognition ---------------------- */

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) return;

    const recognition = new window.webkitSpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript =
        event.results[event.results.length - 1][0].transcript;

      setAnswer((prev) => `${prev} ${transcript}`);
    };

    recognition.onerror = () => {};

    recognitionRef.current = recognition;
  }, []);

  const startMic = () => {
    if (!recognitionRef.current || isAIPlaying) return;

    try {
      recognitionRef.current.start();
    } catch {}
  };

  const stopMic = () => {
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.stop();
    } catch {}
  };

  const toggleMic = () => {
    if (isMicOn) stopMic();
    else startMic();

    setIsMicOn(!isMicOn);
  };

  /* ---------------------- Submit Answer ---------------------- */

  const submitAnswer = async () => {
    if (isSubmitting) return;

    stopMic();
    setIsSubmitting(true);

    try {
      const result = await axios.post(
        `${ServerUrl}/api/interview/submit-answer`,
        {
          interviewId,
          questionIndex: currentIndex,
          answer,
          timeTaken: currentQuestion.timeLimit - timeLeft,
        },
        { withCredentials: true }
      );

      setFeedback(result.data.feedback);

      await speakText(result.data.feedback);
    } catch (error) {
      console.log(error);
      alert("Failed to submit answer.");
    }

    setIsSubmitting(false);
  };

  /* ---------------------- Next Question ---------------------- */

  const handleNext = async () => {
    setAnswer("");
    setFeedback("");

    if (currentIndex + 1 >= questions.length) {
      finishInterview();
      return;
    }

    await speakText("Alright. Let's move to the next question.");

    setCurrentIndex((prev) => prev + 1);
  };

  /* ---------------------- Finish Interview ---------------------- */

  const finishInterview = async () => {
    stopMic();
    setIsMicOn(false);

    try {
      const result = await axios.post(
        `${ServerUrl}/api/interview/finish`,
        { interviewId },
        { withCredentials: true }
      );

      onFinish(result.data);
    } catch (error) {
      console.log(error);
    }
  };

  /* ---------------------- Auto Submit ---------------------- */

  useEffect(() => {
    if (
      !isIntroPhase &&
      currentQuestion &&
      timeLeft === 0 &&
      !feedback &&
      !isSubmitting
    ) {
      submitAnswer();
    }
  }, [timeLeft]);

  /* ---------------------- Cleanup ---------------------- */

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current?.abort();
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-100 flex items-center justify-center p-4">
      <div className="w-full max-w-7xl bg-white rounded-3xl shadow-2xl flex flex-col lg:flex-row overflow-hidden">

        {/* LEFT SIDE */}
        <div className="w-full lg:w-1/3 p-6 bg-white border-r">
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <video
              ref={videoRef}
              src={videoSource}
              key={videoSource}
              muted
              playsInline
              preload="auto"
              className="w-full"
            />
          </div>

          {subtitle && (
            <div className="mt-4 bg-gray-100 rounded-xl p-3">
              <p className="text-center text-gray-700">{subtitle}</p>
            </div>
          )}

          <div className="mt-6 bg-white border rounded-2xl p-5 shadow">
            <div className="flex justify-center mb-4">
              <Timer
                timeLeft={timeLeft}
                totalTime={currentQuestion?.timeLimit}
              />
            </div>

            <div className="flex justify-between text-center">
              <div>
                <h2 className="text-2xl font-bold text-emerald-600">
                  {currentIndex + 1}
                </h2>
                <p className="text-xs text-gray-500">Current</p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-emerald-600">
                  {questions.length}
                </h2>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex-1 p-8 flex flex-col">
          <h1 className="text-2xl font-bold text-emerald-600 mb-6">
            AI Smart Interview
          </h1>

          {!isIntroPhase && (
            <div className="bg-gray-100 rounded-2xl p-5 mb-5">
              <p className="text-sm text-gray-500 mb-2">
                Question {currentIndex + 1} of {questions.length}
              </p>

              <h2 className="text-lg font-semibold">
                {currentQuestion?.question}
              </h2>
            </div>
          )}

          <textarea
            className="flex-1 bg-gray-100 rounded-2xl p-5 resize-none outline-none border focus:ring-2 focus:ring-emerald-500"
            placeholder="Type your answer here..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />

          {!feedback ? (
            <div className="flex gap-4 mt-6">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleMic}
                className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center"
              >
                {isMicOn ? (
                  <FaMicrophone size={20} />
                ) : (
                  <FaMicrophoneSlash size={20} />
                )}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={submitAnswer}
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-2xl font-semibold"
              >
                {isSubmitting ? "Submitting..." : "Submit Answer"}
              </motion.button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-5"
            >
              <p className="text-emerald-700 mb-4">{feedback}</p>

              <button
                onClick={handleNext}
                className="w-full py-3 rounded-xl text-white bg-gradient-to-r from-emerald-600 to-teal-500 flex justify-center items-center gap-2"
              >
                Next Question <BsArrowRight size={18} />
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Step2Interview;