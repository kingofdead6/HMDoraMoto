import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import HomePage from "./Pages/HomePage";
import Navbar from "./Components/Shared/NavBar";
import Footer from "./Components/Shared/Footer";


import Login from "./Pages/Login";
import ProtectedRoute from "./Components/Shared/ProtectedRoute";

import AdminProducts from "./Components/Admin/AdminProducts";


import NotFound from "./Pages/NotFound";
import ScrollToTop from "./Components/Shared/ScrollToTop";

import ProductDetailsPage from "./Components/Products/ProductDetails.jsx";

function App() {
  return (
    <Router>
      <ScrollToTop />


      <div>
        <Navbar />

        <div style={{ flex: 1 }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/:id" element={<ProductDetailsPage />} />
            <Route path="/login" element={<Login />} />

            {/* Protected Admin Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/admin/products" element={<AdminProducts />} />
            </Route>

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
