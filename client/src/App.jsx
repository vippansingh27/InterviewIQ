import React from 'react'
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
//import Navbar from "./components/Navbar";
import axios from 'axios';
import { useEffect } from 'react'
import { useDispatch } from 'react-redux';
import { setUserData } from './redux/userSlice';
import InterviewPage from "./pages/InterviewPage";
import Pricing from './pages/Pricing';
import InterviewReport from './pages/InterviewReport';
import InterviewHistory from './pages/InterviewHistory';
export const ServerUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"

function App() {
    const dispatch = useDispatch()

    useEffect(() => {
      const getUser = async () => {
        try {
          const result = await axios.get(ServerUrl + "/api/user/current-user",
            { withCredentials: true })
          dispatch(setUserData(result.data))
        } catch (error) {
          console.log(error)
          dispatch(setUserData(null))
        }
      }
      getUser()
    }, [dispatch])

  return (
    <div>
      
      <Routes>
        <Route path='/' element={<Home/>} />
        <Route path='/auth' element={<Auth/>} />
        <Route path='/interview' element={<InterviewPage/>} />
        <Route path='/history' element={<InterviewHistory/>} />
        <Route path='/pricing' element={<Pricing/>} />
        <Route path='/report/:id' element={<InterviewReport/>} />
      </Routes>
    </div>
  );
}

export default App;