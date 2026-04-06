import { useState } from "react";
import { Eye, EyeOff } from "lucide-react"

interface PasswordInputProps {
    placeholder: string,
    password: string,
    setPassword: (value: string) => void;
}

export default function PasswordInput({ placeholder, password, setPassword }: PasswordInputProps) {
    const [ reveal, setReveal ] = useState(false);

    return (
        <div className="relative w-full">
            <input 
                type={reveal ? "text" : "password"} 
                placeholder={placeholder} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full font-funnel font-thin border-2 border-foreground rounded-sm p-1 pr-10" 
                required
            />

            {/* Show icon for if its revealed or not */}
            {reveal ? (
                < EyeOff 
                    className="w-4 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer hover:text-secondary"
                    onClick={() => setReveal(false)}
                />
            ) : (
                <Eye 
                    className="w-4 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer hover:text-secondary"
                    onClick={() => setReveal(true)}
                />
            )}
        </div>
    )
}