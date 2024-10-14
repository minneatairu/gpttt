/* eslint-disable react/no-unescaped-entities */
"use client";

import {
  AttachmentIcon,
  BotIcon,
  UserIcon,
  VercelIcon,
} from "../components/Icons";
import { useChat } from "ai/react";
import { DragEvent, useEffect, useRef, useState } from "react";
import Modal from "../components/Modal";
import Chat from "../components/Chat";
import VideoPlayer from "../components/VideoPlayer";
import PrintButton from "../components/PrintButton";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import ImageGenerator from "../components/ImageGenerator";
import EssayContent from "../components/EssayContent";
import References from "../components/References";
import styles from "../styles/index.module.css";



// Custom Markdown renderer based on user or bot role
const MarkdownRenderer = ({ content, role }) => {
  return (
    <ReactMarkdown
      components={{
        p: ({ node, children }) => (
          <motion.p
            className={role === "assistant" ? "bot-message" : "user-message"}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
            }}
          >
            {children}
          </motion.p>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

const getTextFromDataUrl = (dataUrl) => {
  const base64 = dataUrl.split(",")[1];
  return window.atob(base64);
};

function TextFilePreview({ file }) {
  const [content, setContent] = useState("");

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      setContent(typeof text === "string" ? text.slice(0, 100) : "");
    };
    reader.readAsText(file);
  }, [file]);

  return (
    <div>
      {content}
      {content.length >= 100 && "..."}
    </div>
  );
}

export default function Home() {
  const [openModal, setOpenModal] = useState(null);
  const [isGridVisible, setIsGridVisible] = useState(false);
  const [activeButton, setActiveButton] = useState(null);
  const [isVideoVisible, setIsVideoVisible] = useState(true);
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [words, setWords] = useState([]);
  const [currentDate, setCurrentDate] = useState("");

  // Audio references for each overlay
  const audioRef1 = useRef(null);
  const audioRef2 = useRef(null);
  const audioRef3 = useRef(null);
  const audioRef4 = useRef(null);
  const [hasUserChatted, setHasUserChatted] = useState(false); // Track if user has submitted a chat message

  // List of hairstyle types
  const hairstyles = [
    "the Latest Corn Rolls",
    "Strategic Braids",
    "Godly Braids",
    "Divine Corn rolls",
    "Blessed Braids",
    "Miracle Braids",
    "Miracle Corn rolls",
    "Anointed Braids",
    "Expert Braids",
    "Divine Twists",
    "Heavenly Braids",
    "The Finger of God",
    "Holy Braids",
    "Holy Ghost Braids",
  ];

  // Reference to the textarea
  const textAreaRef = useRef(null);

  // Reference to the form
  const formRef = useRef(null);
  const modalRef = useRef(null); // Reference for the modal

  // Function to randomly select a hairstyle
  const getRandomHairstyle = () => {
    return hairstyles[Math.floor(Math.random() * hairstyles.length)];
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isFormExpanded &&
        formRef.current &&
        !formRef.current.contains(event.target)
      ) {
        setIsFormExpanded(false);
        setIsVideoVisible(true); // Show the video when clicking outside the form
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFormExpanded]);

  // Set current date
  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    setCurrentDate(formattedDate);
  }, []);

  // Handle form expansion and ensure modal is closed
  const handleFocusOrPlaceholderClick = () => {
    setIsFormExpanded(true); // Expand the form
    setOpenModal(null);
    setTimeout(() => {
      setIsVideoVisible(false);
    }, 100); // Delay hiding the video
    const selectedHairstyle = getRandomHairstyle();
    const text1 = `✦✦✦✦✦ I'm Da' Braidr ✦✦✦✦✦`;
    const text2 = `♥♥♥ Ur Hairstylist ♥♥♥`;
    const text3 = `Let's generate images of`;
    const text4 = `✿✿✿ ${selectedHairstyle} ✿✿✿`;

    // Split both sentences and concatenate them
    setWords([
      ...text1.split(" "),
      "<br>",
      ...text2.split(" "),
      "<br>",
      ...text3.split(" "),
      "<br>",
      ...text4.split(" "),
    ]);

    // Programmatically focus the textarea when the placeholder or form is clicked
    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault(); // Prevent the form from reloading the page
    setIsVideoVisible(false); // Hide the video when submitting the form
    setIsGridVisible(true); // Show the grid
  };

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    setIsGridVisible(false); // Hide the grid
    setIsVideoVisible(true); // Show the video when grid is closed
  };

  // Handle modal opening and ensure form is closed
  const openModalHandler = (modalType) => {
    setOpenModal(modalType);
    setIsFormExpanded(false);
    setTimeout(() => {
      setIsVideoVisible(false);
    }, 100); // Delay hiding the video
  };

  const handleCloseModal = () => {
    setOpenModal(null); // Close the modal
    setActiveButton(null); // Reset active button when modal is closed
    setIsVideoVisible(true);
  };

  // Handle each overlay click with different sound
  const handleOverlayClick = (audioRef) => {
    if (audioRef.current) {
      audioRef.current.play();
    }
    handleFocusOrPlaceholderClick(); // Expand form
  };

  // Close the modal when clicking outside
  useEffect(() => {
    const handleClickOutsideModal = (event) => {
      if (
        openModal &&
        modalRef.current &&
        !modalRef.current.contains(event.target)
      ) {
        setOpenModal(null); // Close the modal when clicking outside
      }
    };

    document.addEventListener("mousedown", handleClickOutsideModal);
    return () => {
      document.removeEventListener("mousedown", handleClickOutsideModal);
    };
  }, [openModal]);

  const { messages, input, handleSubmit, handleInputChange, isLoading } =
    useChat({
      onError: () =>
        toast.error("You've been rate limited, please try again later!"),
    });

  const [files, setFiles] = useState(null);
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handlePaste = (event) => {
    const items = event.clipboardData?.items;

    if (items) {
      const files = Array.from(items)
        .map((item) => item.getAsFile())
        .filter((file) => file !== null);

      if (files.length > 0) {
        const validFiles = files.filter(
          (file) =>
            file.type.startsWith("image/") || file.type.startsWith("text/")
        );

        if (validFiles.length === files.length) {
          const dataTransfer = new DataTransfer();
          validFiles.forEach((file) => dataTransfer.items.add(file));
          setFiles(dataTransfer.files);
        } else {
          toast.error("Only image and text files are allowed");
        }
      }
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFiles = event.dataTransfer.files;
    const droppedFilesArray = Array.from(droppedFiles);
    if (droppedFilesArray.length > 0) {
      const validFiles = droppedFilesArray.filter(
        (file) =>
          file.type.startsWith("image/") || file.type.startsWith("text/")
      );

      if (validFiles.length === droppedFilesArray.length) {
        const dataTransfer = new DataTransfer();
        validFiles.forEach((file) => dataTransfer.items.add(file));
        setFiles(dataTransfer.files);
      } else {
        toast.error("Only image and text files are allowed!");
      }

      setFiles(droppedFiles);
    }
    setIsDragging(false);
  };

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <>
      <div>
        {/* Audio elements for each overlay */}
        <audio ref={audioRef1} src="/mad.mp3" />
        <audio ref={audioRef2} src="/mad.mp3" />
        <audio ref={audioRef3} src="/mad.mp3" />
        <audio ref={audioRef4} src="/mad.mp3" />
        {/* Title Section */}

        <div className="title-section">
          <div className="title-wrapper">
            <span className="title">DA BRAIDR DA BRAIDR DA BRAIDR...</span>
          </div>
        </div>
        {/* Static Title for Print */}
        <h1 className="print-title" style={{ display: "none" }}>
          DA BRAIDR
          <br />
          <span
            style={{
              position: "absolute",
              bottom: 0,

              fontSize: "10px",
              fontFamily: "Kode Mono",
              textAlign: "center",
            }}
          >
            This AI-generated content was produced on {currentDate} using DA
            BRAIDR - a multimodal system designed by Minne Atairu
          </span>{" "}
        </h1>

        {/* Button Section */}
        <div className="button-section">
          <button
            className="animated-placeholder"
            onClick={handleFocusOrPlaceholderClick}
          >
            {"GENERATE UR BRAIDS".split(" ").map((word, index) => (
              <span key={index} style={{ animationDelay: `${index * 0.5}s` }}>
                {word}&nbsp;
              </span>
            ))}
          </button>
          <button
            className="button-border animated-placeholder"
            onClick={() => openModalHandler("text")}
          >
            {" "}
            {"      TEXT DA BRAIDR".split(" ").map((word, index) => (
              <span key={index} style={{ animationDelay: `${index * 0.5}s` }}>
                {word}&nbsp;
              </span>
            ))}
          </button>
        </div>
        {/* Info Modal */}
        {openModal === "info" && (
          <Modal onClose={handleCloseModal} className="modal-grid">
            {/* Modal content */}
            <div className="modal-column">
              <EssayContent />
            </div>
            <div className="modal-column border">
              <References />
            </div>
          </Modal>
        )}
        {/* Text Da Braidr Modal */}
        {openModal === "text" && (
          <Modal onClose={handleCloseModal} className="modal-bottom-right">
            <Chat />
            {messages.length > 0 && (
              <PrintButton
                onPrintClick={handlePrint}
                onCloseClick={handleClose}
                isFromGptChatModal={true}
              />
            )}

            <div
              className="gpt-container"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <AnimatePresence>
                {isDragging && (
                  <motion.div
                    className="gpt-drag-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div>Drag and drop files here</div>
                    <div className="gpt-drag-subtext">
                      {"(images and text)"}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="gpt-message-container">
                {messages.length > 0 ? (
                  <div className="gpt-message-list">
                    {messages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        className={`gpt-message ${
                          message.role === "assistant" ? "assistant" : "user"
                        }`}
                        initial={{ y: 5, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                      >
                        <div className="gpt-name">
                          {message.role === "assistant" ? (
                            <span>Da Braidr</span>
                          ) : (
                            <span>You</span>
                          )}
                        </div>

                        <div className="gpt-message-content">
                          <div className="gpt-text">
                            <MarkdownRenderer
                              content={message.content}
                              role={message.role}
                            />
                          </div>

                          <div className="gpt-attachments">
                            {message.experimental_attachments?.map(
                              (attachment) =>
                                attachment.contentType?.startsWith("image") ? (
                                  <img
                                    className="gpt-image"
                                    key={attachment.name}
                                    src={attachment.url}
                                    alt={attachment.name}
                                  />
                                ) : attachment.contentType?.startsWith(
                                    "text"
                                  ) ? (
                                  <div className="gpt-text-preview">
                                    {getTextFromDataUrl(attachment.url)}
                                  </div>
                                ) : null
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {isLoading &&
                      messages[messages.length - 1].role !== "assistant" && (
                        <div className="gpt-loading-message">
                          <div className="gpt-icon-container">
                            <BotIcon />
                          </div>
                          <div className="gpt-loading-text">
                            <div>hmm...</div>
                          </div>
                        </div>
                      )}

                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <motion.div className="gpt-empty-message-container">
                    <div className="gpt-empty-message-box">
                      <p className="gpt-empty-message-text"></p>
                    </div>
                  </motion.div>
                )}

                <form
                  className="gpt-input-form"
                  onSubmit={(event) => {
                    const options = files
                      ? { experimental_attachments: files }
                      : {};
                    handleSubmit(event, options);
                    setFiles(null);
                  }}
                >
                  <AnimatePresence>
                    {files && files.length > 0 && (
                      <div className="gpt-file-preview">
                        {Array.from(files).map((file) =>
                          file.type.startsWith("image") ? (
                            <div key={file.name}>
                              <motion.img
                                src={URL.createObjectURL(file)}
                                alt={file.name}
                                className="gpt-file-image"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{
                                  y: -10,
                                  scale: 1.1,
                                  opacity: 0,
                                  transition: { duration: 0.2 },
                                }}
                              />
                            </div>
                          ) : file.type.startsWith("text") ? (
                            <motion.div
                              key={file.name}
                              className="gpt-file-text-preview"
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{
                                y: -10,
                                scale: 1.1,
                                opacity: 0,
                                transition: { duration: 0.2 },
                              }}
                            >
                              <TextFilePreview file={file} />
                            </motion.div>
                          ) : null
                        )}
                      </div>
                    )}
                  </AnimatePresence>

                  <input
                    ref={inputRef}
                    className="gpt-input"
                    placeholder="✿ Ask a question + drag a braid ✿"
                    value={input}
                    onChange={handleInputChange}
                    onPaste={handlePaste}
                  />

                  {/* Centered Submit Button */}
                  <div className="button-container">
                    <button type="submit" className="chat-button">
                      SUBMIT
                    </button>
                  </div>
                </form>
              </div>
            </div>
            <div className="psycho">
              <a
                href="https://scholar.google.com/scholar?hl=en&as_sdt=0%2C33&q=pscyhohairapy&btnG="
                target="_blank"
                rel="noopener noreferrer"
              >
                Learn more from human Psychohairapy Researchers
              </a>
            </div>
          </Modal>
        )}

        {/* Text Prompt Form */}
        {isFormExpanded && (
          <form
            className="text-prompt-form expanded"
            onSubmit={handleFormSubmit}
            style={{
              backgroundColor: "black",
              color: "white",
              position: "relative",
              border: "none",
            }}
            ref={formRef}
          >
            <div className="animated-text-container">
              <div className="animated-text">
                {words.map((word, index) =>
                  word === "<br>" ? (
                    <br key={index} style={{ marginBottom: "20px" }} />
                  ) : (
                    <span
                      key={index}
                      style={{ animationDelay: `${index * 0.2}s` }}
                    >
                      {word}&nbsp;
                    </span>
                  )
                )}
              </div>
              <div>
                <ImageGenerator />
              </div>
              <textarea
                className="genetext"
                placeholder=""
                ref={textAreaRef}
                style={{ minHeight: "100px", width: "100%" }}
              />
            </div>
          </form>
        )}

        {/* Print and Close Button */}
        {isGridVisible && (
          <PrintButton onPrintClick={handlePrint} onCloseClick={handleClose} />
        )}
        {/* Video with Overlay Text */}
        {isVideoVisible && (
          <div className="video-container">
            <VideoPlayer />

            <div
              className="video-overlay-text"
              onClick={() => openModalHandler("info")}
            >
              <h2>ABOUT DA BRAIDR</h2>
            </div>

            <div
              className="video-overlay-text-two"
              onClick={() => handleOverlayClick(audioRef2)}
            >
              <h2>
                CALL AYEESHA
                <br /> 808-666-3333
              </h2>
            </div>
            <div
              className="video-overlay-text-three"
              onClick={() => handleOverlayClick(audioRef3)}
            >
              <h2>
                FINE
                <br /> GEH
              </h2>
            </div>

            <div
              className="video-overlay-text-four"
              onClick={() => handleOverlayClick(audioRef4)}
            >
              <h2>
                THE FINGER
                <br /> OF GOD
              </h2>
            </div>
          </div>
        )}
        {/* Grid Section */}
        {isGridVisible && <div className="grid-section"></div>}
      </div>
    </>
  );
}
