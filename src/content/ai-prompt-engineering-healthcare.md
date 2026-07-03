# AI Prompt Engineering for Healthcare

## Leveraging LLMs in Clinical and IT Workflows

Artificial Intelligence and Large Language Models (LLMs) are transforming healthcare IT by automating documentation, summarizing patient histories, and generating complex database queries. However, because LLMs are prone to "hallucinations," strict prompt engineering frameworks must be utilized to ensure accuracy and safety.

## Effective Prompting Strategies

### Role-Prompting
Assigning the AI a highly specific clinical or technical persona increases the precision and relevance of outputs.

> *Example: "Act as a senior EHR database administrator with expertise in HL7 FHIR R4 standards. Analyze the following patient data payload and identify any non-conformant fields..."*

### Few-Shot Prompting
Providing the model with 2–3 accurate examples of the desired output format before asking it to process new data drastically reduces the error rate in clinical summarizations.

```
Example Input: "Patient presented with chest pain, shortness of breath."
Example Output: { "chief_complaint": "chest pain", "secondary_symptom": "shortness of breath" }

Now process: "Patient presented with acute lower back pain and nausea."
```

### Context Constraints
Explicitly instructing the model not to guess eliminates dangerous hallucinated clinical data.

> *Example: "If the patient's discharge date is not explicitly stated in the text below, output 'DATA NOT FOUND'. Do not infer or estimate the date."*

### Chain-of-Thought (CoT) Prompting
For complex diagnostic or troubleshooting tasks, instruct the model to reason step by step before providing its final answer. This significantly improves accuracy on multi-step IT and clinical problems.

## The PHI Scrubbing Rule

The most critical rule of prompt engineering in healthcare is that **unredacted PHI must never be entered into public, consumer-grade AI tools** (like standard ChatGPT). All prompt testing and execution must occur within enterprise-secured, BAA-covered, local or private cloud LLM instances.

**Pre-prompt PHI checklist:**
- [ ] Remove patient names, dates of birth, and SSNs
- [ ] Remove MRN (Medical Record Numbers) and account numbers
- [ ] Remove geographic data smaller than state level
- [ ] Replace with synthetic or anonymized placeholders

## Evaluating AI Output Quality

Before using any AI-generated clinical or administrative output, apply the TRACE framework:

| Letter | Check |
|--------|-------|
| **T** | **Truthful**  - Is this factually accurate? Can it be verified? |
| **R** | **Relevant**  - Does this directly address the query? |
| **A** | **Actionable**  - Can a clinician or IT professional act on this? |
| **C** | **Complete**  - Is any critical information missing? |
| **E** | **Ethical**  - Does this respect patient privacy and professional standards? |

## References & Citations

- **OpenAI:** [Prompt Engineering Best Practices](https://platform.openai.com/docs/guides/prompt-engineering)  - *Official documentation for maximizing model accuracy and reducing hallucinations.*
- **HealthIT.gov:** [Artificial Intelligence in Health and Human Services](https://www.healthit.gov/topic/artificial-intelligence)  - *Federal perspectives on the safe and responsible use of AI in healthcare data environments.*
