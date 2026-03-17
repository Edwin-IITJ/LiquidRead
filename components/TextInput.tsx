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
            className="w-full rounded-xl border border-slate-200 px-5 py-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
        />
    );
}
