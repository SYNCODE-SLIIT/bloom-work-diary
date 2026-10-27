"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  Download,
  Facebook,
  Linkedin,
  MessageCircle,
  Send,
  Share2,
  Twitter
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DiaryEntry } from "@/types/diary";

interface ShareMemoryProps {
  entry: Pick<DiaryEntry, "date" | "title">;
  buttonClassName?: string;
  align?: "start" | "end";
}

export function ShareMemory({ entry, buttonClassName, align = "start" }: ShareMemoryProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  function getShareDetails() {
    return {
      url: `${window.location.origin}/memory/${entry.date}`,
      text: `${entry.title} — a day from my Bloom work diary`
    };
  }

  async function handleShare() {
    const { url, text } = getShareDetails();

    if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({ title: entry.title, text, url });
      } catch {
        // The share sheet was closed without sharing.
      }
      return;
    }

    setOpen((value) => !value);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(getShareDetails().url);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
        setOpen(false);
      }, 1400);
    } catch {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="share-control">
      <button
        className={buttonClassName}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={handleShare}
      >
        <Share2 size={16} />
        Share
      </button>

      {open ? (
        <ShareMenu
          entry={entry}
          align={align}
          copied={copied}
          details={getShareDetails()}
          onCopy={copyLink}
          onPick={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}

interface ShareMenuProps {
  entry: Pick<DiaryEntry, "date">;
  align: "start" | "end";
  copied: boolean;
  details: { url: string; text: string };
  onCopy: () => void;
  onPick: () => void;
}

function ShareMenu({ entry, align, copied, details, onCopy, onPick }: ShareMenuProps) {
  const url = encodeURIComponent(details.url);
  const text = encodeURIComponent(details.text);
  const networks = [
    {
      label: "WhatsApp",
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodeURIComponent(`${details.text} ${details.url}`)}`
    },
    {
      label: "Facebook",
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${url}`
    },
    { label: "X", icon: Twitter, href: `https://x.com/intent/tweet?text=${text}&url=${url}` },
    {
      label: "LinkedIn",
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`
    },
    { label: "Telegram", icon: Send, href: `https://t.me/share/url?url=${url}&text=${text}` }
  ];

  return (
    <div className={cn("share-menu", align === "end" && "align-end")} role="menu">
      <p className="share-heading">Share this day</p>
      {networks.map(({ label, icon: Icon, href }) => (
        <a
          key={label}
          className="share-option"
          role="menuitem"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onPick}
        >
          <Icon size={16} />
          {label}
        </a>
      ))}
      <hr />
      <button className="share-option" type="button" role="menuitem" onClick={onCopy}>
        {copied ? <Check size={16} /> : <Copy size={16} />}
        {copied ? "Link copied" : "Copy link"}
      </button>
      <a
        className="share-option"
        role="menuitem"
        href={`/memory/${entry.date}/card`}
        download={`bloom-${entry.date}.png`}
        onClick={onPick}
      >
        <Download size={16} />
        Save image for Instagram
      </a>
    </div>
  );
}
