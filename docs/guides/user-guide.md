# User Guide

Complete guide to using Flowgenix for building AI-powered workflows.

## Getting Started

After setting up Flowgenix (see [Getting Started](getting-started.md)), you can start building workflows.

## Workflow Components

### 1. User Query Component

**Purpose**: Entry point for user input in workflows

**Configuration**: None required

**Usage**:
- Drag from component library to canvas
- Always use as the starting point of your workflow
- Connects to other components to pass user input

### 2. Knowledge Base Component

**Purpose**: Document storage and retrieval with semantic search

**Configuration**:
- **Upload Documents**: Click "Upload Documents" to add files
- **Supported Formats**: PDF, TXT, DOCX
- **Processing**: Files are automatically chunked and embedded

**Usage**:
- Upload relevant documents for your workflow
- Connect to LLM Engine to provide context
- Documents are searchable via semantic similarity

**Tips**:
- Upload documents related to your use case
- Multiple documents can be uploaded to the same Knowledge Base
- Larger documents are automatically chunked for better retrieval

### 3. LLM Engine Component

**Purpose**: AI text generation and analysis

**Configuration**:
- **Model**: Select AI model (currently Gemini Pro)
- **Temperature**: Control randomness (0.0 = deterministic, 1.0 = creative)
- **Max Tokens**: Maximum response length
- **System Prompt**: Custom instructions for the AI

**Usage**:
- Central component for AI processing
- Can receive input from User Query, Knowledge Base, Web Search
- Generates intelligent responses based on all inputs

**Best Practices**:
- Use specific system prompts for better results
- Lower temperature for factual queries
- Higher temperature for creative tasks

### 4. Web Search Component

**Purpose**: Retrieve current information from the internet

**Configuration**:
- **Search Provider**: Choose between Brave Search or SerpAPI
- **Number of Results**: How many search results to retrieve
- **Search Query**: Can be dynamic based on user input

**Usage**:
- Connect after User Query to search for current information
- Combine with LLM Engine for analysis of search results
- Useful for real-time data that's not in your documents

**Requirements**:
- Requires API key for chosen search provider
- Optional component (workflows work without it)

### 5. Output Component

**Purpose**: Display final results to the user

**Configuration**:
- **Format**: Choose output format (text, JSON, markdown)
- **Template**: Custom formatting template

**Usage**:
- Always end your workflow with an Output component
- Receives processed results from other components
- Displays final response to user

## Building Your First Workflow

### Simple Document Q&A Workflow

1. **Add Components**:
   ```
   User Query → LLM Engine → Output
                ↑
   Knowledge Base
   ```

2. **Configure**:
   - Upload documents to Knowledge Base
   - Set LLM Engine system prompt: "Answer questions based on the provided documents"
   - Keep Output format as "text"

3. **Connect Components**:
   - User Query output → LLM Engine input
   - Knowledge Base output → LLM Engine context
   - LLM Engine output → Output input

4. **Test**:
   - Save workflow
   - Open chat interface
   - Ask questions about your documents

### Research Workflow with Web Search

1. **Add Components**:
   ```
   User Query → Web Search → LLM Engine → Output
   ```

2. **Configure**:
   - Web Search: Set provider and number of results
   - LLM Engine: "Analyze and summarize the search results"

3. **Test**:
   - Ask about current events or recent information
   - AI will search and analyze results

### Advanced Multi-Source Workflow

1. **Add Components**:
   ```
   User Query → LLM Engine → Output
       ↓           ↑
   Web Search     Knowledge Base
   ```

2. **Configure**:
   - Upload relevant documents
   - Enable web search for current info
   - System prompt: "Use both documents and search results to provide comprehensive answers"

## Chat Interface

### Using the Chat

1. **Start Conversation**: Click "Chat with Stack"
2. **Ask Questions**: Type questions related to your workflow
3. **View Responses**: AI responses support markdown formatting
4. **Conversation History**: Previous messages are saved per workflow

### Chat Features

- **Markdown Support**: AI responses can include:
  - **Bold text** with `**bold**`
  - *Italic text* with `*italic*`
  - `Code snippets` with backticks
  - Lists and formatting

- **Copy Messages**: Hover over messages to copy content
- **Real-time Responses**: See typing indicators during AI processing
- **Persistent History**: Conversations are saved with workflows

## Workflow Management

### Saving Workflows

1. Click "Save Workflow" button
2. Enter a descriptive name
3. Optionally add description
4. Workflow is saved to your account

### Loading Workflows

1. Click "Load Workflow"
2. Select from your saved workflows
3. Workflow loads with all configurations

### Workflow Validation

Before execution, Flowgenix validates:
- All components are properly connected
- Required configurations are set
- API keys are available for enabled features

## Advanced Features

### Custom System Prompts

Enhance AI responses with specific instructions:

```
You are a helpful research assistant. When analyzing documents:
1. Provide specific citations
2. Summarize key findings
3. Highlight any limitations or uncertainties
4. Use bullet points for clarity
```

### Document Organization

- **Workflow-Specific**: Documents are associated with specific workflows
- **Multiple Uploads**: Add multiple documents to build comprehensive knowledge bases
- **Automatic Processing**: Text extraction and embedding generation is automatic

### Real-time Processing

- **Live Updates**: See processing status in real-time
- **Progress Indicators**: Visual feedback during execution
- **Error Handling**: Clear error messages for troubleshooting

## Common Use Cases

### 1. Document Analysis
- Upload research papers, reports, or manuals
- Ask specific questions about content
- Get summaries and insights

### 2. Customer Support
- Upload product documentation
- Create workflows to answer customer questions
- Combine with web search for latest updates

### 3. Content Research
- Use web search for current information
- Combine with existing knowledge base
- Generate comprehensive reports

### 4. Data Processing
- Upload data files and documentation
- Create workflows for data analysis
- Generate insights and visualizations

### 5. Educational Tools
- Upload textbooks or course materials
- Create Q&A workflows for studying
- Generate practice questions and explanations

## Best Practices

### Workflow Design
1. **Start Simple**: Begin with basic workflows and add complexity
2. **Clear Connections**: Ensure logical flow between components
3. **Test Incrementally**: Test workflows as you build them
4. **Descriptive Names**: Use clear, descriptive workflow names

### Document Management
1. **Relevant Content**: Upload documents relevant to your use case
2. **Quality Over Quantity**: Better to have focused, high-quality documents
3. **Regular Updates**: Keep document sets current
4. **Organize by Topic**: Create separate workflows for different topics

### AI Optimization
1. **Specific Prompts**: Use detailed system prompts for better results
2. **Temperature Control**: Adjust based on use case
3. **Context Management**: Provide relevant context through connections
4. **Iterative Improvement**: Refine prompts based on results

### Performance Tips
1. **Document Size**: Larger documents may take longer to process
2. **Search Results**: More search results provide more context but slower processing
3. **Connection Logic**: Ensure efficient workflow connections
4. **Regular Testing**: Test workflows regularly to ensure optimal performance

## Troubleshooting

### Common Issues

**Workflow Won't Execute**:
- Check all components are connected
- Verify required API keys are set
- Ensure all configurations are complete

**Poor AI Responses**:
- Review system prompts for clarity
- Check if relevant documents are uploaded
- Verify connections between components

**Slow Performance**:
- Reduce number of search results
- Optimize document sizes
- Check system resources

**Upload Failures**:
- Verify file format is supported
- Check file size limits
- Ensure stable internet connection

### Getting Help

- Check [Troubleshooting Guide](../development/troubleshooting.md)
- Review [API Documentation](api-reference.md)
- Join our [Discord Community](https://discord.gg/flowgenix)
- Create [GitHub Issues](https://github.com/your-repo/flowgenix/issues)

## Next Steps

- [Architecture Guide](architecture.md) - Understand how Flowgenix works
- [Development Guide](../development/setup.md) - Contribute to the project
- [Demo Walkthrough](demo.md) - See advanced examples
- [API Reference](api-reference.md) - Integrate with external systems
