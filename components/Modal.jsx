"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Modal = ({ onClose, children, className, position }) => {
  const modalRef = useRef(null);
  const positionClass = position ? `modal-${position}` : ""; // Handle different positions

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose(); // Close modal if clicked outside
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Close modal when clicking on the overlay (outside the modal content)
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose(); // Close modal when clicking on the overlay
    }
  };

  // Conditionally apply inline styles for the black background
  const isBlackBackground = className === "modal-bottom-right";
  const overlayStyle = {
    backgroundColor: isBlackBackground ? "black" : "white",
    ...(isBlackBackground && {
      display: "flex", // Ensure flexbox is applied
      justifyContent: "center", // Horizontally center the content
      alignItems: "center", // Vertically center the content
    }),
  };

  // Style for the close button based on background color
  const closeButtonStyle = {
    color: isBlackBackground ? "white" : "black", // White text if background is black
    cursor: "pointer",
    fontSize: "24px", // Example styling for the close button
    position: "absolute", // Make it absolute for positioning
    top: "10px", // Adjust as needed
    right: "10px", // Adjust as needed
  };

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        style={overlayStyle} // Apply conditional style for background color
        onClick={handleOverlayClick} // Close the modal when clicking on the overlay
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          ref={modalRef} // Ref to modal content for click detection
          className={`modal-content ${className} ${positionClass}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          <span
            className="close-button"
            style={closeButtonStyle}
            onClick={onClose}
          >
            X
          </span>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Modal;
