"use client";

import { useCallback, useRef, useState } from "react";
import styles from "./PgnUploader.module.css";

interface Props {
  onLoad: (pgn: string) => void;
  error: string | null;
}

const SAMPLE_PGN = `[Event "Kasparov vs. Deep Blue Rematch"]
[Site "New York, NY USA"]
[Date "1997.05.11"]
[Round "6"]
[White "Deep Blue"]
[Black "Kasparov, G"]
[Result "1-0"]

1.e4 c5 2.c3 d5 3.exd5 Qxd5 4.d4 Nf6 5.Nf3 Bg4 6.Be2 e6 7.h3 Bh5 8.O-O
Nc6 9.Be3 cxd4 10.cxd4 Bb4 11.a3 Ba5 12.Nc3 Qd6 13.Nb5 Qe7 14.Ne5 Bxe2
15.Qxe2 O-O 16.Rac1 Rac8 17.Bg5 Bb6 18.Bxf6 gxf6 19.Nc4 Rfd8 20.Nxb6
axb6 21.Rfd1 f5 22.Qe3 Qf6 23.d5 Rxd5 24.Rxd5 exd5 25.b3 Kh8 26.Qxb6
Rg8 27.Qc5 d4 28.Nd6 f4 29.Nxb7 Ne5 30.Qd5 f3 31.g3 Nd3 32.Rc7 Re8
33.Nd6 Re1+ 34.Kh2 Nxf2 35.Nxf7+ Kg7 36.Ng5+ Kh6 37.Rxh7+ 1-0`;

export function PgnUploader({ onLoad, error }: Props) {
  const [mode, setMode] = useState<"paste" | "file">("paste");
  const [pgnText, setPgnText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePaste = useCallback(() => {
    if (pgnText.trim()) onLoad(pgnText.trim());
  }, [pgnText, onLoad]);

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        if (text) onLoad(text.trim());
      };
      reader.readAsText(file);
    },
    [onLoad]
  );

  const handleSample = useCallback(() => {
    setPgnText(SAMPLE_PGN);
    onLoad(SAMPLE_PGN);
  }, [onLoad]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${mode === "paste" ? styles.active : ""}`}
          onClick={() => setMode("paste")}
        >
          Paste PGN
        </button>
        <button
          className={`${styles.tab} ${mode === "file" ? styles.active : ""}`}
          onClick={() => setMode("file")}
        >
          Upload File
        </button>
      </div>

      {mode === "paste" && (
        <div className={styles.pasteSection}>
          <textarea
            className={styles.textarea}
            placeholder="Paste your PGN here…"
            value={pgnText}
            onChange={(e) => setPgnText(e.target.value)}
            rows={10}
            spellCheck={false}
          />
          <div className={styles.actions}>
            <button className={styles.btnSecondary} onClick={handleSample}>
              Load Sample Game
            </button>
            <button
              className={styles.btnPrimary}
              onClick={handlePaste}
              disabled={!pgnText.trim()}
            >
              Load Game →
            </button>
          </div>
        </div>
      )}

      {mode === "file" && (
        <div className={styles.fileSection}>
          <div
            className={styles.dropzone}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                  const text = ev.target?.result as string;
                  if (text) onLoad(text.trim());
                };
                reader.readAsText(file);
              }
            }}
          >
            <div className={styles.dropIcon}>♟</div>
            <p>Drop a <strong>.pgn</strong> file here</p>
            <span>or click to browse</span>
            <input
              ref={fileRef}
              type="file"
              accept=".pgn,.txt"
              style={{ display: "none" }}
              onChange={handleFile}
            />
          </div>
        </div>
      )}

      {error && <p className={styles.error}>⚠ {error}</p>}
    </div>
  );
}
