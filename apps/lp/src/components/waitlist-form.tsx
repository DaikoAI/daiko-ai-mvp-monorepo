"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";

export function WaitListForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Google Form submission
      const formUrl = "https://docs.google.com/forms/d/e//formResponse";
      const formData = new FormData();
      formData.append("entry.1001758430", email); // Replace YOUR_ENTRY_ID with the actual entry ID

      // Using fetch with no-cors mode because Google Forms doesn't support CORS
      await fetch(formUrl, {
        method: "POST",
        mode: "no-cors",
        body: formData,
      });

      setIsSubmitted(true);
      setEmail("");
      toast.success("You've been added to the waitlist!");
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("An error occurred while submitting the form. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} target="_blank">
      {!isSubmitted ? (
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            name="email"
            aria-label="email"
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-white/5 border-white/10 focus:border-[#E5A05C]/50 focus:ring-[#E5A05C]/20"
          />
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-to-r from-[#E5A05C] to-[#E55C9F] hover:opacity-90 text-white font-medium"
          >
            {isSubmitting ? "Joining..." : "Join"}
          </Button>
        </div>
      ) : (
        <div className="text-center py-2 text-[#E5A05C]">
          Thanks for joining! We&apos;ll be in touch soon.
        </div>
      )}
    </form>
  );
}
