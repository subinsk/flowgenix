# Workflow Builder – Example Flows & Use Cases

This document provides practical examples of how to use the Workflow Builder to create powerful, modular AI workflows. Each example demonstrates a different use case, showing how to connect and configure nodes for real-world scenarios.

---

## Example 1: Simple Q&A Chatbot

**Goal:** Answer user questions using an LLM (e.g., GPT-4) without external context.

**Steps:**
1. **Add User Query Node** – Entry point for user input.
2. **Add LLM Engine Node** – Connect it to the User Query node. Configure the model (e.g., GPT-4) and provide your API key.
3. **Add Output Node** – Connect it to the LLM Engine node. Choose output format (e.g., plain text).
4. **Build & Test** – Click "Build" to validate, then use the chat dialog to ask questions.

---

## Example 2: Document-Enhanced Assistant

**Goal:** Answer questions using both LLM and uploaded documents for context.

**Steps:**
1. **Add User Query Node**.
2. **Add Knowledge Base Node** – Upload relevant documents (PDF, TXT, etc.) and provide a ChromaDB API key.
3. **Add LLM Engine Node** – Connect both User Query and Knowledge Base nodes to the LLM Engine. Configure the model and API key.
4. **Add Output Node** – Connect to the LLM Engine.
5. **Build & Test** – Validate and chat. The assistant will use both user input and document context.

---

## Example 3: Web-Search Augmented LLM

**Goal:** Enable the LLM to use real-time web search for up-to-date answers.

**Steps:**
1. **Add User Query Node**.
2. **Add LLM Engine Node** – Connect User Query to LLM Engine. Enable "Web Search" in the LLM Engine node and provide a SERP API key.
3. **Add Output Node** – Connect to the LLM Engine.
4. **Build & Test** – Validate and chat. The LLM will use web search results to answer queries.

---

## Example 4: Multi-Modal Workflow (Text + File)

**Goal:** Accept both user text and file input, process with LLM, and output a summary.

**Steps:**
1. **Add User Query Node** – For text input.
2. **Add Knowledge Base Node** – For file/document input.
3. **Add LLM Engine Node** – Connect both User Query and Knowledge Base nodes to the LLM Engine. Configure as needed.
4. **Add Output Node** – Set output to "Summary" or another format.
5. **Build & Test** – Validate and chat. The workflow will combine user text and file content for processing.

---

## Tips for All Flows
- **Validation:** Always click "Build" before testing. Errors will be shown in the sidebar, header, and node inputs.
- **Undo/Redo:** Use these features to experiment safely.
- **Notifications:** Watch for error/success toasts for feedback.
- **Modularity:** You can reuse and adapt these flows for more complex scenarios.

---

For more details, see the main documentation or in-app tooltips.
