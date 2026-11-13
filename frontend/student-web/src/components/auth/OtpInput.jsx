import { useRef } from "react";
import OutlinedInput from "@mui/material/OutlinedInput";

const LENGTH = 6;

export default function OtpInput({ digits, onChange, error = false, disabled = false, firstRef }) {
    const refs = useRef([]);

    const focusAt = (i) => refs.current[Math.max(0, Math.min(LENGTH - 1, i))]?.focus();

    const handleChange = (i, e) => {
        const d = e.target.value.replace(/\D/g, "").slice(-1);
        const next = [...digits];
        next[i] = d;
        onChange(next);
        if (d && i < LENGTH - 1) focusAt(i + 1);
    };

    const handleKeyDown = (i, e) => {
        if (e.key === "Backspace" && !digits[i] && i > 0) {
            e.preventDefault();
            const next = [...digits];
            next[i - 1] = "";
            onChange(next);
            focusAt(i - 1);
        } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            focusAt(i - 1);
        } else if (e.key === "ArrowRight") {
            e.preventDefault();
            focusAt(i + 1);
        }
    };

    const handlePaste = (e) => {
        const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);
        if (!text) return;
        e.preventDefault();
        const next = Array(LENGTH).fill("");
        text.split("").forEach((ch, idx) => {
            next[idx] = ch;
        });
        onChange(next);
        focusAt(text.length >= LENGTH ? LENGTH - 1 : text.length);
    };

    return (
        <div className="grid grid-cols-6 gap-2 min-[601px]:gap-3" role="group" aria-label="Mã OTP gồm 6 chữ số">
            {digits.map((digit, i) => (
                <OutlinedInput
                    key={i}
                    value={digit}
                    error={error}
                    disabled={disabled}
                    onChange={(e) => handleChange(i, e)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={handlePaste}
                    onFocus={(e) => e.target.select()}
                    inputRef={(el) => {
                        refs.current[i] = el;
                        if (i === 0 && firstRef) firstRef.current = el;
                    }}
                    inputProps={{
                        inputMode: "numeric",
                        autoComplete: i === 0 ? "one-time-code" : "off",
                        "aria-label": `Chữ số thứ ${i + 1}`,
                    }}
                    sx={{
                        "& input": { textAlign: "center", padding: 0, fontSize: "1.6rem", fontWeight: 600 },
                    }}
                />
            ))}
        </div>
    );
}
