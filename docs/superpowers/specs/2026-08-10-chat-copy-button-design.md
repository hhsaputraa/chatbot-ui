# Design Spec: Chat Message Action Bar & Copy Button Redesign

Date: 2026-08-10
Status: Approved

## Overview
Redesign the chat bubble copy button in `ChatMessage.vue` to align with modern AI chat user interfaces (ChatGPT, Gemini). The copy button will be repositioned from floating outside the bubble corners (`position: absolute; bottom: -10px; right: -10px;`) into an integrated action bar underneath the message content.

## Architectural & Design Details

### 1. Component Structure (`ChatMessage.vue`)
- Move copy button into a dedicated `.message-actions` row container.
- Place `.message-actions` inside `.message-content` at the bottom of the content section.
- Enable copy button for both `user` and `bot` message roles.

### 2. Layout & Alignment
- **User Messages**: `.message-actions` aligned to flex-end (right).
- **Bot Messages**: `.message-actions` aligned to flex-start (left).
- Button layout: Clean icon button with optional text/tooltip indicator ("Salin" / "Tersalin!").

### 3. Hover & Micro-interactions
- Resting state: `opacity: 0` (or semi-transparent `0.4`).
- Message hover state: `.message-content:hover .message-actions` transitions smoothly to `opacity: 1`.
- Click state: Icon changes from `heroicons:document-duplicate` to `heroicons:check` with visual green accent and copied status feedback.

### 4. Implementation Scope
- File affected: `d:\app\ai\chatbot-ui\src\components\ChatMessage.vue`
