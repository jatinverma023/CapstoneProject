import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(to bottom right, #eff6ff, #e0e7ff, #f3e8ff)",
      }}
    >
      <div className="container mx-auto px-4 pt-20 pb-16">
        <div className="text-center max-w-4xl mx-auto mb-16">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full shadow-sm border mb-6"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              backdropFilter: "blur(8px)",
              borderColor: "#DBEAFE",
            }}
          >
            <span className="text-sm font-medium text-gray-700">
              ✨ Modern Assignment Management
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="text-gray-900">Welcome to </span>
            <span
              style={{
                background: "linear-gradient(to right, #2563eb, #9333ea)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Smart Assignment
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Streamline your academic workflow with intelligent assignment
            management, real-time submissions, and powerful analytics.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/login"
              className="px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2 text-white"
              style={{
                background: "linear-gradient(to right, #2563eb, #9333ea)",
              }}
            >
              Get Started →
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
          {/* Feature 1 */}
          <div
            className="rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              backdropFilter: "blur(8px)",
              borderColor: "#DBEAFE",
              border: "1px solid #DBEAFE",
            }}
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 text-white text-2xl font-bold"
              style={{
                background:
                  "linear-gradient(to bottom right, #3b82f6, #2563eb)",
              }}
            >
              📝
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Assignment Management
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Create, organize, and manage assignments with ease. Set deadlines,
              rubrics, and track submissions in real-time.
            </p>
          </div>

          {/* Feature 2 */}
          <div
            className="rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              backdropFilter: "blur(8px)",
              borderColor: "#E9D5FF",
              border: "1px solid #E9D5FF",
            }}
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 text-white text-2xl font-bold"
              style={{
                background:
                  "linear-gradient(to bottom right, #a855f7, #9333ea)",
              }}
            >
              ✅
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Smart Grading
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Grade submissions efficiently with customizable rubrics and
              provide detailed feedback to help students improve.
            </p>
          </div>

          {/* Feature 3 */}
          <div
            className="rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              backdropFilter: "blur(8px)",
              borderColor: "#C7D2FE",
              border: "1px solid #C7D2FE",
            }}
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 text-white text-2xl font-bold"
              style={{
                background:
                  "linear-gradient(to bottom right, #6366f1, #4f46e5)",
              }}
            >
              📊
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Powerful Analytics
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Get insights into student performance, submission trends, and
              identify areas that need attention.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
