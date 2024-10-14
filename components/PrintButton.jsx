export default function PrintButton({
  onPrintClick,
  onCloseClick,
  isFromGptChatModal = false, // Default to false if not provided
}) {
  return (
    <div className="button-container">
      <button onClick={onPrintClick} className="print-button">
        {isFromGptChatModal ? "PRINT UR CHAT" : "PRINT UR BRAIDS"}
      </button>
      <button onClick={onCloseClick} className="close-print-button">
        X
      </button>
    </div>
  );
}
