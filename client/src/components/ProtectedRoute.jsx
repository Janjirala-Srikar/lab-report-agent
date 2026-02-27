import { Navigate } from "react-router-dom";
import ChatBot from "./ChatBot";

const ProtectedRoute = ({ element }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      {element}
      <ChatBot />
    </>
  );
};

export default ProtectedRoute;
