import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Course from "./pages/Course";
import MainLayout from "./components/layout/MainLayout";
import { TooltipProvider } from "./components/ui/tooltip";
import StickyNavLayout from "./components/layout/StickyNavLayout";
import Profile from "./pages/Profile";
import PasswordReset from "./pages/PasswordReset";
import { AuthDialogProvider } from "./context/AuthDialogProvider";



function App() {
  return (
    // Wrap the app with dialog provider for global access
    <AuthDialogProvider>
      <Routes>

        {/* Landing Page with Course Search */}
        <Route element={<StickyNavLayout/>}>
          <Route path="/" element={<Home />} />
        </Route>
        
        {/* Individual Course Pages */}
        <Route element={<MainLayout />}>
          <Route
            path="/course/:courseId"
            element={
              <TooltipProvider>
                <Course />
              </TooltipProvider>
            }
          />
          <Route 
            path="/profile/:userId"
            element={
              <Profile />
            }
          />
        </Route>

        {/* Password reset link */}
        <Route path="/reset-password" element={<PasswordReset/>} />

      </Routes>
    </AuthDialogProvider>
  );
}

export default App;