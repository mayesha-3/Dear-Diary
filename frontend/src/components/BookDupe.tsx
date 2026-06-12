import React, { useState } from "react";
import "./css/Book.css";

export default function BookDupe() {
  const [currentPage, setCurrentPage] = useState(0);

  const handleClick = () => {
    if (currentPage < 5) {
      setCurrentPage(currentPage + 1);
    } else {
      setCurrentPage(0);
    }
  };

  return (
    <div>
      <div className="book" onClick={handleClick}>
        <div className={`page ${currentPage > 0 ? "flipped" : ""}`}>
          <div className="front">cover</div>
          <div className="back"></div>
        </div>
        <div className={`page ${currentPage > 1 ? "flipped" : ""}`}>
          <div className="front">Page 3</div>
          <div className="back">Page 4</div>
        </div>
        <div className={`page ${currentPage > 2 ? "flipped" : ""}`}>
          <div className="front">Page 5</div>
          <div className="back">Page 6</div>
        </div>
        <div className={`page ${currentPage > 3 ? "flipped" : ""}`}>
          <div className="front">Page 7</div>
          <div className="back">Page 8</div>
        </div>
        <div className={`page ${currentPage > 4 ? "flipped" : ""}`}>
          <div className="front">Page 9</div>
          <div className="back">Page 10</div>
        </div>
      </div>
    </div>
  );
}
