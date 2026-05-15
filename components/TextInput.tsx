"use client";

interface TextInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export default function TextInput({ value, onChange, placeholder }: TextInputProps) {
    return (
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-xl border border-[#DDD5C8] bg-[#FDFAF5] px-5 py-4 text-[#2C2218] placeholder-[#9C8B78] focus:outline-none focus:border-[#7C5C3E] focus:ring-2 focus:ring-[#EDE5D8] transition-all"
        />
    );
}
