"use client";

import React from "react";

interface AIRecommendationFormatterProps {
  recommendation: string;
}

/**
 * AIRecommendationFormatter - A reusable component for formatting and displaying AI recommendations
 * with consistent styling across different pages.
 */
export function AIRecommendationFormatter({ recommendation }: AIRecommendationFormatterProps) {
  if (!recommendation || recommendation.trim() === "") {
    return null;
  }

  // Process the recommendation text
  const formatRecommendation = () => {
    // Get the text - use let to allow modifications
    let tipText = recommendation;

    // Extract intro (everything before first numbered item)
    let intro = "";
    let restOfContent = tipText;

    const introEndMatch = /\n\d+\./.exec(tipText);

    if (introEndMatch?.index !== undefined) {
      const introEndIndex = introEndMatch.index;

      intro = tipText.substring(0, introEndIndex).trim();
      restOfContent = tipText.substring(introEndIndex).trim();
    }

    // Extract final tip if present
    let finalTip = "";
    const tipMatch = /artificialIntelligenceTip for the day:?\s*"?([^"]+)"?/i.exec(tipText);

    if (tipMatch?.[1]) {
      finalTip = tipMatch[1].trim();
      restOfContent = restOfContent
        .replace(/Here's your artificialIntelligenceTip for the day:.*$/s, "")
        .trim();
    }

    // Check for final note about checking in
    let finalNote = "";

    if (
      restOfContent.includes("Check in with me tomorrow") ||
      restOfContent.includes("Remember, it")
    ) {
      const noteMatch = /(Remember[^]*|Check in[^]*)$/.exec(restOfContent);

      if (noteMatch?.[0]) {
        finalNote = noteMatch[0].trim();
        restOfContent = restOfContent.replace(/(Remember[^]*|Check in[^]*)$/, "").trim();
      }
    }

    // Pre-process all content to completely remove any asterisks
    tipText = tipText.replace(/\*/g, "");
    restOfContent = restOfContent.replace(/\*/g, "");
    intro = intro.replace(/\*/g, "");
    finalNote = finalNote.replace(/\*/g, "");

    // Special case for emoji-prefixed sections
    let sections = [];

    // Check if this is emoji-prefixed format (like entry from March 5)
    if (!introEndMatch && /\n\p{Emoji}/u.exec(tipText)) {
      // Handle the intro part first
      const introLines = tipText.split("\n");

      intro = introLines?.length > 0 ? (introLines[0] ?? "") : ""; // First line is intro

      // Split content by emoji-prefixed lines and numbered items
      const emojiSplit = tipText.split(/\n(?=[\p{Emoji}]|Remember|Check|\d+\.)/u);

      // First item is the intro, we already handled it
      sections = [intro].concat(emojiSplit?.slice(1) ?? []);
    } else {
      // Regular numbered format
      const splitContent = restOfContent.split(/\n(?=\d+\.)/);

      sections = intro ? [intro].concat(splitContent ?? []) : (splitContent ?? []);
    }

    return {
      intro,
      sections,
      finalTip,
      finalNote,
    };
  };

  const { sections, finalTip, finalNote } = formatRecommendation();

  return (
    <div className="recommendation-content">
      {/* First section is intro if it doesn't start with a number */}
      {sections[0] && !/^\d+\./.exec(sections[0]) && (
        <p className="mb-4 text-lg font-medium">{sections[0]}</p>
      )}

      {/* Process all numbered sections */}
      <div className="space-y-4">
        {sections.map((section, index) => {
          // Skip the intro section which we already rendered
          if (index === 0 && !/^\d+\./.exec(section)) {
            return null;
          }
          if (!section.trim()) {
            return null;
          }

          // Extract number if it exists
          const numberMatch = /^(\d+)\./.exec(section);
          const itemNumber = numberMatch ? numberMatch[1] : "";

          // Process the content after the number
          let content = numberMatch
            ? section.substring(numberMatch[0].length).trim()
            : section.trim();

          // Check for emoji at the start
          const emojiMatch = /^([\p{Emoji}]+)/u.exec(content);
          let itemEmoji = "";

          if (emojiMatch?.length && emojiMatch[0].trim()) {
            itemEmoji = emojiMatch[0].trim();
            content = content.substring(emojiMatch[0].length).trim();
          }

          // Special case - check if this section starts with an emoji (no number)
          if (!itemNumber && /^[\p{Emoji}]/u.exec(section.trim())) {
            const fullEmojiMatch = /^([\p{Emoji}]+)/u.exec(section.trim());

            if (fullEmojiMatch?.[0]) {
              itemEmoji = fullEmojiMatch[0].trim();
            }
          }

          // Check for bold title
          let itemTitle = "";
          let itemDescription = "";

          // Super simplified approach - just strip out markdown first
          const cleanContent = content.replace(/\*/g, "");

          // Check for a colon separator which indicates title:description format
          if (cleanContent.includes(":")) {
            const parts = cleanContent.split(":", 2);

            if (parts.length >= 2) {
              itemTitle = parts[0]?.trim() ?? "";
              itemDescription = parts[1]?.trim() ?? "";
            }
          }
          // Check for newlines which might separate title from description
          else if (cleanContent.includes("\n")) {
            const lines = cleanContent.split("\n");

            if (lines.length > 0) {
              itemTitle = lines[0]?.trim() ?? "";
              if (lines.length > 1) {
                itemDescription = lines.slice(1).join("\n").trim();
              }
            }
          }
          // If it has a number but no clear title/description, use it all as title
          else if (itemNumber) {
            itemTitle = cleanContent;
          }
          // Otherwise just use as description
          else {
            itemDescription = cleanContent;
          }

          // Clean up any remaining markdown
          itemTitle = itemTitle.replace(/\*/g, "");
          itemDescription = itemDescription.replace(/\*/g, "");

          return (
            <div key={index} className="recommendation-item mb-5">
              {/* Special case for emoji-only sections */}
              {itemEmoji && !itemNumber && !/^\d+\./.test(section) ? (
                <div className="flex items-start space-x-3">
                  <span className="flex-shrink-0 text-xl">{itemEmoji}</span>
                  <div className="flex-1">
                    {itemTitle && <p className="font-semibold text-blue-600">{itemTitle}</p>}
                    {itemDescription && (
                      <p className={`${itemTitle ? "mt-1" : ""}`}>{itemDescription}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-start">
                  {/* Numbered items */}
                  {itemNumber && (
                    <span className="mr-3 flex-shrink-0 font-semibold text-blue-600">
                      {itemNumber}.
                    </span>
                  )}
                  <div className="flex-1">
                    {(itemEmoji || itemTitle) && (
                      <div className="flex items-center">
                        {itemEmoji && <span className="mr-2 text-lg">{itemEmoji}</span>}
                        {itemTitle && (
                          <span className="font-semibold text-blue-600">{itemTitle}</span>
                        )}
                      </div>
                    )}
                    {itemDescription && (
                      <p className={`${itemTitle ? "mt-1" : ""}`}>{itemDescription}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Show final tip if exists */}
      {finalTip && (
        <div className="mt-5 border-t pt-3">
          <p className="font-medium">Today&apos;s tip:</p>
          <p className="italic">{finalTip}</p>
        </div>
      )}

      {/* Show final note if exists */}
      {finalNote && <p className="mt-4 pt-2 text-sm font-medium text-blue-700">{finalNote}</p>}
    </div>
  );
}
