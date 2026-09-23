"use client";

import { useState } from "react";
import { Check, Link2, Mail } from "lucide-react";
// lucide dropped its brand glyphs; the site's own are what the footer and
// utility bar already use, so sharing matches the icons beside it.
import { Facebook, Linkedin, Twitter } from "@/components/Shared";

interface Props {
  /** Absolute URL — a share target cannot resolve a relative one. */
  url: string;
  title: string;
}

/**
 * Share links for an article.
 *
 * Plain anchors to each network's share endpoint rather than their SDKs:
 * an embedded widget loads third-party script on a page every visitor
 * reads, and these are four links that work without any of it.
 *
 * "Copy link" is the one that needs JS, because writing to the clipboard
 * is the only part a link cannot do.
 */
export default function ShareButtons({ url, title }: Props) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const targets = [
    {
      label: "Share on LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: <Linkedin className="h-4 w-4" />,
      hover: "hover:border-[#0A66C2] hover:bg-[#0A66C2] hover:text-white",
    },
    {
      label: "Share on X",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      icon: <Twitter className="h-4 w-4" />,
      hover: "hover:border-slate-900 hover:bg-slate-900 hover:text-white",
    },
    {
      label: "Share on Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: <Facebook className="h-4 w-4" />,
      hover: "hover:border-[#1877F2] hover:bg-[#1877F2] hover:text-white",
    },
    {
      label: "Share by email",
      // The body carries the URL: an email with only a subject line leaves
      // the reader nothing to click.
      href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
      icon: <Mail className="h-4 w-4" />,
      hover: "hover:border-slate-500 hover:bg-slate-500 hover:text-white",
    },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      // Long enough to read, short enough that the button is ready again
      // before a second attempt.
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused outright (an insecure origin, or a
      // browser that asks). Saying nothing is better than an error for
      // something the reader can still do by hand from the address bar.
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {targets.map((target) => (
        <a
          key={target.label}
          href={target.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={target.label}
          title={target.label}
          className={`flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors ${target.hover}`}
        >
          {target.icon}
        </a>
      ))}

      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Link copied" : "Copy link"}
        title={copied ? "Link copied" : "Copy link"}
        className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors ${
          copied
            ? "border-emerald-200 bg-emerald-50 text-emerald-600"
            : "border-slate-200 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-700"
        }`}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" /> Copied
          </>
        ) : (
          <>
            <Link2 className="h-4 w-4" /> Copy link
          </>
        )}
      </button>
    </div>
  );
}
