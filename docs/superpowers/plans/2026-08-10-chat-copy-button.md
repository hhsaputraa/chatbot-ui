# Redesign Chat Message Copy Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reposition and redesign the copy button in `ChatMessage.vue` to sit underneath the message content in an action bar style (ChatGPT & Gemini style), active for both user and bot messages.

**Architecture:** Update Vue template structure in `ChatMessage.vue` to wrap the copy button inside `.message-actions`, adjust layout alignment based on message role (`user` vs `bot`), update styling to offer smooth hover fade-in and micro-interactions.

**Tech Stack:** Vue 3, CSS (Scoped), Iconify (`@iconify/vue`)

## Global Constraints
- Modify `ChatMessage.vue` cleanly without breaking existing message types (`text`, `error`, `dangerous`, `warning`, `data`, `suggestion`, `insight`).
- Maintain existing clipboard functionality using `copyText`.

---

### Task 1: Update `ChatMessage.vue` Template and CSS

**Files:**
- Modify: `d:/app/ai/chatbot-ui/src/components/ChatMessage.vue:11-18,479-516`

- [ ] **Step 1: Move copy button to `.message-actions` container inside `.message-content`**

Move the copy button template to the bottom of `.message-content` so it applies to both user and bot messages:

```html
      <!-- Message Actions (Copy Button Action Bar) -->
      <div class="message-actions">
        <button
          class="copy-btn"
          @click="copyText"
          :title="copied ? 'Tersalin!' : 'Salin Teks'"
        >
          <Icon :icon="copied ? 'heroicons:check' : 'heroicons:document-duplicate'" class="copy-icon" />
          <span class="copy-text">{{ copied ? 'Tersalin!' : 'Salin' }}</span>
        </button>
      </div>
```

- [ ] **Step 2: Update CSS for `.message-actions` and `.copy-btn`**

Replace old floating absolute positioning with clean action bar styling:

```css
/* Message Actions Bar */
.message-actions {
  display: flex;
  align-items: center;
  margin-top: 8px;
  padding-top: 4px;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}

.message-block.user .message-actions {
  justify-content: flex-end;
}

.message-block.bot .message-actions {
  justify-content: flex-start;
}

.message-block:hover .message-actions {
  opacity: 1;
}

.copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  color: var(--text-muted, #a0aec0);
  border: none;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
}

.copy-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.copy-icon {
  width: 15px;
  height: 15px;
}

.copy-text {
  font-size: 0.75rem;
  font-weight: 500;
}
```

- [ ] **Step 3: Test and verify UI rendering**

Verify in dev server (`npm run dev`) or browser preview that copy button appears in the action bar underneath messages on hover and copies text properly.
