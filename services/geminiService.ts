import { GoogleGenAI, Type } from "@google/genai";
import { TechnicalAuditResult, SiteAuditResult, ContentBrief, SerpSimulationResult } from '../types';

const API_KEY = process.env.GEMINI_API_KEY;

// Check if the Gemini API is configured, but don't crash the app if it's not.
const isGeminiConfigured = !!API_KEY;

// Initialize AI only if the key exists, otherwise it will throw an error on instantiation.
const ai = isGeminiConfigured ? new GoogleGenAI({ apiKey: API_KEY }) : null;

const GEMINI_UNCONFIGURED_ERROR = "AI features are disabled because the Gemini API key is not configured.";


const serpSimulationSchema = {
  type: Type.OBJECT,
  properties: {
    predicted_rank: {
      type: Type.STRING,
      description: "The AI's predicted ranking position for the draft content (e.g., '8-12', 'Top 5')."
    },
    strengths: {
      type: Type.ARRAY,
      description: "A list of 2-3 key strengths of the draft content when compared to the likely competition.",
      items: { type: Type.STRING }
    },
    weaknesses: {
      type: Type.ARRAY,
      description: "A list of 2-3 critical weaknesses or gaps in the draft content.",
      items: { type: Type.STRING }
    },
    recommendations: {
      type: Type.ARRAY,
      description: "A list of the top 3-5 most impactful, actionable recommendations to improve the content's ranking potential.",
      items: { type: Type.STRING }
    },
  },
  required: ["predicted_rank", "strengths", "weaknesses", "recommendations"],
};


export const runSerpSimulation = async (keyword: string, draftContent: string): Promise<SerpSimulationResult> => {
  if (!ai) throw new Error(GEMINI_UNCONFIGURED_ERROR);

  const systemInstruction = `
    You are "The Oracle," an elite SEO strategist with unparalleled predictive power. Your task is to simulate how a piece of draft content will perform in the live search results for a given keyword.

    **Primary Objective:**
    Analyze the user's draft content in the context of the likely top-ranking competitors for the keyword: "${keyword}". You must provide a brutally honest assessment and a clear, actionable path to improvement.

    **Execution Steps:**
    1.  **Analyze the Draft:** Read the user's draft content and understand its core message, structure, and depth.
    2.  **Infer the SERP:** Based on the keyword, infer the user intent and the types of content that are likely ranking (e.g., listicles, guides, reviews, product pages).
    3.  **Compare and Contrast:** Mentally compare the user's draft to the inferred top competitors.
    4.  **Predict Rank:** Based on your analysis, predict a realistic ranking range for the draft content *in its current state*.
    5.  **Identify Strengths:** Pinpoint 2-3 specific aspects where the draft content is strong.
    6.  **Identify Weaknesses:** Pinpoint 2-3 specific, critical weaknesses or content gaps that are holding it back.
    7.  **Generate Recommendations:** Provide a list of the top 3-5 most impactful and actionable recommendations. These should be "cheat codes"—concrete steps the user can take to significantly improve their ranking potential. Examples: "Add a comparative table of features for X, Y, and Z," "Include a section answering the question 'How does X work?'," "Embed a short tutorial video."

    Return your complete analysis in the required JSON format.
  `;

  const contents = `
    KEYWORD: "${keyword}"

    DRAFT CONTENT:
    ---
    ${draftContent}
    ---
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: serpSimulationSchema,
      },
    });

    const jsonText = response.text.trim();
    const parsedResult = JSON.parse(jsonText) as SerpSimulationResult;
    
    // Basic validation
    if (!parsedResult || !parsedResult.predicted_rank || !Array.isArray(parsedResult.recommendations)) {
      throw new Error("Invalid response format from API.");
    }
    
    return parsedResult;

  } catch (error) {
    console.error("Error running SERP simulation:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to simulate SERP for "${keyword}": ${error.message}`);
    }
    throw new Error(`An unknown error occurred while simulating SERP for "${keyword}".`);
  }
};


const technicalAuditSchema = {
  type: Type.OBJECT,
  properties: {
    audit_results: {
      type: Type.ARRAY,
      description: "A list of SEO audit categories.",
      items: {
        type: Type.OBJECT,
        required: ["category_name", "checks"],
        properties: {
          category_name: {
            type: Type.STRING,
            description: "The name of the audit category (e.g., 'On-Page SEO', 'Performance & Speed', 'Mobile Friendliness').",
          },
          checks: {
            type: Type.ARRAY,
            description: "A list of specific checks within this category.",
            items: {
              type: Type.OBJECT,
              required: ["check_name", "status", "description", "recommendation"],
              properties: {
                check_name: {
                  type: Type.STRING,
                  description: "The specific item being checked (e.g., 'Title Tag Presence', 'Meta Description Length')."
                },
                status: {
                  type: Type.STRING,
                  enum: ["PASS", "FAIL", "WARN"],
                  description: "The result of the check.",
                },
                description: {
                  type: Type.STRING,
                  description: "A one-sentence explanation of the check's result for the given URL."
                },
                recommendation: {
                  type: Type.STRING,
                  description: "A concrete, actionable recommendation to fix the issue if status is FAIL or WARN. If PASS, state what was done correctly."
                }
              }
            }
          }
        }
      }
    }
  },
  required: ["audit_results"],
};

export const performTechnicalAudit = async (url: string): Promise<TechnicalAuditResult> => {
  if (!ai) throw new Error(GEMINI_UNCONFIGURED_ERROR);
  
  const prompt = `
    You are 'The Inspector', a world-class Technical SEO specialist with 20 years of experience.
    Your task is to conduct a technical SEO audit for the webpage at this URL: "${url}".
    
    First, infer the page's purpose from the URL structure (e.g., is it a homepage, blog post, product page, category page?).
    Then, based on its likely purpose, perform a detailed audit. You cannot crawl the URL, so base your analysis on common best practices and pitfalls for that type of page.
    
    Your audit must cover these key categories:
    1.  **On-Page SEO**: Title tags, meta descriptions, header structure (H1, H2s), image alt text.
    2.  **Performance & Speed**: Core Web Vitals (LCP, FID, CLS), image optimization, use of browser caching.
    3.  **Mobile Friendliness**: Viewport configuration, tap target sizes.
    4.  **Accessibility**: Color contrast, ARIA labels for interactive elements.
    5.  **Indexability & Crawlability**: Presence of a hypothetical robots.txt and sitemap, use of canonical tags.

    For each check, provide a status (PASS, FAIL, or WARN), a description of the finding, and a highly actionable recommendation.
    - **PASS**: The page likely meets the best practice.
    - **WARN**: A potential issue or an area for improvement.
    - **FAIL**: A critical issue that needs immediate attention.
    
    Return your complete audit in the required JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: technicalAuditSchema,
      },
    });

    const jsonText = response.text.trim();
    const parsedResult = JSON.parse(jsonText) as TechnicalAuditResult;
    
    if (!parsedResult || !Array.isArray(parsedResult.audit_results)) {
      throw new Error("Invalid response format from API.");
    }
    
    return parsedResult;

  } catch (error) {
    console.error("Error performing technical audit:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to audit "${url}": ${error.message}`);
    }
    throw new Error(`An unknown error occurred while auditing "${url}".`);
  }
};

// --- Full Site Audit ---

const generateMockCrawlData = (site_url: string) => ({
  "site_url": site_url,
  "crawl_data": [
    { "url": `${site_url}/`, "status_code": 200, "title_tag": "Welcome to AwesomeSite", "meta_description": "The best site for awesome things.", "h1_tags": ["Welcome!"], "h2_tags": ["Our Services", "About Us"], "word_count": 800, "internal_links_count": 25, "external_links_count": 2, "load_time_ms": 1200, "has_schema": true, "schema_types": ["Organization"], "image_count": 5, "images_missing_alt_text": 1, "is_canonicalized": true, "canonical_url": `${site_url}/` },
    { "url": `${site_url}/about`, "status_code": 200, "title_tag": "About Us | AwesomeSite", "meta_description": "", "h1_tags": ["Our Story"], "h2_tags": ["Our Team", "Our Mission"], "word_count": 450, "internal_links_count": 10, "external_links_count": 0, "load_time_ms": 2100, "has_schema": false, "schema_types": [], "image_count": 3, "images_missing_alt_text": 2, "is_canonicalized": true, "canonical_url": `${site_url}/about` },
    { "url": `${site_url}/blog/first-post`, "status_code": 200, "title_tag": "Our First Post", "meta_description": "Our exciting first blog post about stuff.", "h1_tags": ["Our First Post"], "h2_tags": ["Why we started", "What's next"], "word_count": 1500, "internal_links_count": 8, "external_links_count": 3, "load_time_ms": 900, "has_schema": true, "schema_types": ["Article"], "image_count": 2, "images_missing_alt_text": 0, "is_canonicalized": true, "canonical_url": `${site_url}/blog/first-post` },
    { "url": `${site_url}/services`, "status_code": 200, "title_tag": "Services | AwesomeSite", "meta_description": "Our services are the best.", "h1_tags": ["What We Do"], "h2_tags": ["Service A", "Service B"], "word_count": 300, "internal_links_count": 5, "external_links_count": 1, "load_time_ms": 1800, "has_schema": false, "schema_types": [], "image_count": 0, "images_missing_alt_text": 0, "is_canonicalized": false, "canonical_url": `${site_url}/products` },
    { "url": `${site_url}/old-page`, "status_code": 301, "title_tag": "", "meta_description": "", "h1_tags": [], "h2_tags": [], "word_count": 0, "internal_links_count": 0, "external_links_count": 0, "load_time_ms": 300, "has_schema": false, "schema_types": [], "image_count": 0, "images_missing_alt_text": 0, "is_canonicalized": false, "canonical_url": "" },
    { "url": `${site_url}/broken-link`, "status_code": 404, "title_tag": "Not Found", "meta_description": "", "h1_tags": ["404 Not Found"], "h2_tags": [], "word_count": 50, "internal_links_count": 1, "external_links_count": 0, "load_time_ms": 450, "has_schema": false, "schema_types": [], "image_count": 0, "images_missing_alt_text": 0, "is_canonicalized": false, "canonical_url": "" }
  ],
  "error_summary": {
    "404_errors": [`${site_url}/broken-link`, `${site_url}/another-missing-page`],
    "5xx_errors": [],
    "redirect_chains": [
      { "source": `${site_url}/redirect-a`, "destination": `${site_url}/redirect-c`, "chain": [`${site_url}/redirect-b`] }
    ]
  },
  "core_web_vitals_summary": {
    "lcp_average_ms": 3100,
    "cls_average_score": 0.21,
    "fid_average_ms": 150
  },
  "google_search_console_summary": {
    "top_queries": [
      { "query": "awesome things", "clicks": 800, "impressions": 15000 },
      { "query": "awesomesite services", "clicks": 200, "impressions": 3000 },
      { "query": "what is awesomesite", "clicks": 50, "impressions": 5000 }
    ],
    "top_pages": [
      { "url": `${site_url}/`, "clicks": 750, "impressions": 14000 },
      { "url": `${site_url}/services`, "clicks": 150, "impressions": 2500 }
    ],
    "manual_actions": "None"
  }
});

const siteAuditSchema = {
    type: Type.OBJECT,
    properties: {
        audit_summary: {
            type: Type.OBJECT,
            properties: {
                site_url: { type: Type.STRING },
                overall_health_score: { type: Type.INTEGER },
                executive_summary: { type: Type.STRING },
            },
            required: ["site_url", "overall_health_score", "executive_summary"],
        },
        findings: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    issue_id: { type: Type.STRING },
                    category: { type: Type.STRING },
                    title: { type: Type.STRING },
                    severity: { type: Type.STRING, enum: ['Low', 'Medium', 'High', 'Critical', 'Opportunity'] },
                    description: { type: Type.STRING },
                    business_impact: { type: Type.STRING },
                    affected_urls: { type: Type.ARRAY, items: { type: Type.STRING } },
                    recommended_action: { type: Type.STRING },
                },
                required: ["issue_id", "category", "title", "severity", "description", "business_impact", "affected_urls", "recommended_action"],
            },
        },
    },
    required: ["audit_summary", "findings"],
};

export const performFullSiteAudit = async (url: string): Promise<SiteAuditResult> => {
    if (!ai) throw new Error(GEMINI_UNCONFIGURED_ERROR);
    
    const systemInstruction = `
        **AI Persona & Role:**
        You are "SEO-Flow Oracle," a world-class SEO expert with 20 years of experience. Your expertise spans technical SEO, on-page optimization, content strategy, and user experience. You are a master at interpreting raw data and translating it into a prioritized, strategic action plan. Your goal is not just to identify problems, but to explain *why* they are problems, what their impact is, and provide clear, actionable solutions. You communicate with clarity, authority, and a focus on business-impact.

        **Primary Objective:**
        Conduct a comprehensive SEO audit of the provided website data. Analyze the data in its entirety, identify critical issues and opportunities, and structure your findings into a clear, prioritized report. For each issue, you must provide a "Severity Score" (Low, Medium, High, Critical), explain the "Business Impact," and offer a "Recommended Action."

        **Input Data Structure:**
        You will be provided with a JSON object containing the following data scraped from the target website.

        **Execution Steps & Output Format:**
        Analyze the provided JSON data and perform the following steps. Structure your final output as a valid JSON object following the format specified. Do not include any text or explanation outside of the final JSON object.
        1. **Overall Site Health Score:** Based on all the data, provide a single score from 0 to 100 representing the site's overall SEO health, along with a concise executive summary.
        2. **Technical SEO Analysis:** Analyze crawl_data for status code issues (4xx, 5xx), redirect chains, and slow load times. Analyze core_web_vitals_summary and flag any metrics that do not meet Google's recommended thresholds. Identify site-wide canonicalization issues or patterns.
        3. **On-Page SEO Analysis:** Analyze crawl_data for patterns of missing/duplicate/short/long title tags and meta descriptions. Identify pages with thin content (low word_count). Identify issues with heading structure (e.g., missing H1s, multiple H1s). Identify site-wide issues with images missing alt text.
        4. **Content & Strategy Opportunities:** Cross-reference crawl_data and google_search_console_summary. Identify "Striking Distance" keywords, "Content Cannibalization", and "Orphan Pages".
    `;

    const mockData = generateMockCrawlData(url);
    const contents = `Please perform a full site audit based on this data: ${JSON.stringify(mockData, null, 2)}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: siteAuditSchema,
            },
        });

        const jsonText = response.text.trim();
        const parsedResult = JSON.parse(jsonText) as SiteAuditResult;

        if (!parsedResult || !parsedResult.audit_summary || !Array.isArray(parsedResult.findings)) {
            throw new Error("Invalid response format from API.");
        }

        return parsedResult;

    } catch (error) {
        console.error("Error performing full site audit:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to audit site "${url}": ${error.message}`);
        }
        throw new Error(`An unknown error occurred while auditing site "${url}".`);
    }
};

// --- Content Briefs ---

const generateMockSerpData = (keyword: string) => {
    return {
        keyword: keyword,
        top_10_results: [
            { title: `${keyword} - The Ultimate Guide`, snippet: `Everything you need to know about ${keyword}. Our comprehensive guide covers all aspects...`, text_content: `The primary goal of this guide is to explain ${keyword} in detail. We will cover its history, its applications, and future trends.` },
            { title: `What is ${keyword}? Explained Simply`, snippet: `A simple explanation of ${keyword} for beginners. Understand the core concepts quickly.`, text_content: `For beginners, ${keyword} can seem complex. This article breaks it down into easy-to-understand parts. We focus on the 'what' and 'why'.` },
            { title: `Top 5 Benefits of Using ${keyword}`, snippet: `Discover the main advantages of implementing ${keyword} in your workflow.`, text_content: `Many people wonder about the benefits. This post outlines the top five advantages, including cost savings and efficiency.` },
            { title: `How to Get Started with ${keyword}`, snippet: `A step-by-step tutorial on implementing ${keyword} from scratch.`, text_content: `This tutorial provides a clear, step-by-step process. We cover installation, setup, and first use.` },
            { title: `Comparing ${keyword} vs. Other Solutions`, snippet: `See how ${keyword} stacks up against its main competitors in the market.`, text_content: `An in-depth comparison is crucial. We analyze features, pricing, and user reviews for ${keyword} and its alternatives.` },
            { title: `Advanced Techniques for ${keyword}`, snippet: `For experienced users, this article explores advanced strategies.`, text_content: `Once you master the basics, you can explore these advanced techniques to get the most out of ${keyword}.` },
            { title: `Common ${keyword} Mistakes to Avoid`, snippet: `Learn about common pitfalls when using ${keyword} and how to prevent them.`, text_content: `Avoid these common mistakes. We've compiled a list of errors new users often make.` },
            { title: `Case Study: How We Improved ROI with ${keyword}`, snippet: `A real-world case study showing the impact of ${keyword}.`, text_content: `This case study demonstrates the real-world success achieved by using ${keyword}, with specific metrics on ROI.` },
            { title: `The Future of ${keyword}`, snippet: `Experts predict the future trends and evolution of ${keyword}.`, text_content: `What does the future hold? We asked industry experts for their predictions on the evolution of ${keyword}.` },
            { title: `Frequently Asked Questions about ${keyword}`, snippet: `Get answers to the most common questions about ${keyword}.`, text_content: `This FAQ section answers the top questions we receive, covering everything from pricing to technical support.` },
        ]
    };
};

const contentBriefSchema = {
    type: Type.OBJECT,
    properties: {
        target_keyword: { type: Type.STRING },
        user_intent: { type: Type.STRING, description: "A concise summary of what the user is most likely trying to accomplish by searching for this keyword." },
        recommended_structure: {
            type: Type.ARRAY,
            description: "A logical article structure with H2s and corresponding H3s.",
            items: {
                type: Type.OBJECT,
                properties: {
                    h2: { type: Type.STRING, description: "The text for an H2 heading." },
                    h3s: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of H3 subheadings that fall under this H2." }
                },
                required: ["h2", "h3s"]
            }
        },
        key_entities: {
            type: Type.ARRAY,
            description: "A list of important concepts, people, or places that should be mentioned in the article to demonstrate expertise.",
            items: { type: Type.STRING }
        },
        people_also_ask: {
            type: Type.ARRAY,
            description: "A list of common questions related to the keyword that should be answered in the content.",
            items: { type: Type.STRING }
        }
    },
    required: ["target_keyword", "user_intent", "recommended_structure", "key_entities", "people_also_ask"],
};


export const generateContentBrief = async (keyword: string): Promise<ContentBrief> => {
    if (!ai) throw new Error(GEMINI_UNCONFIGURED_ERROR);

    const systemInstruction = `
        **AI Persona & Role:**
        You are "The Content Architect," a world-class Content Strategist with deep expertise in SEO and user psychology. Your superpower is deconstructing complex topics and SERP data into a perfect, actionable content blueprint. You don't just suggest topics; you provide a strategic framework for creating content that ranks and satisfies user intent.

        **Primary Objective:**
        Analyze the provided mock SERP data for a given keyword. Your goal is to synthesize this information into a comprehensive content brief that a writer can use to create a best-in-class article. The brief must be logical, thorough, and directly informed by the patterns you observe in the provided data.

        **Execution Steps & Output Format:**
        Based on the provided JSON data of top-ranking articles, you must:
        1.  **Determine User Intent:** Analyze the titles and snippets to determine the primary goal of the user. Is it informational, commercial, navigational, or transactional? Summarize this clearly.
        2.  **Create a Recommended Structure:** Synthesize the topics covered in the top results to create a logical flow for a new, superior article. Structure this as a list of H2s, with relevant H3s nested underneath. Combine and rephrase concepts to create the best possible outline.
        3.  **Identify Key Entities & Topics:** Extract the most important and frequently mentioned nouns, concepts, and themes from the data. These are the "must-include" topics for demonstrating topical authority.
        4.  **Identify 'People Also Ask' Questions:** Based on the provided content, infer and list the critical questions a user would have about this topic. Frame them as direct questions.

        Structure your final output as a valid JSON object following the specified schema. Do not include any text or explanation outside of the final JSON object.
    `;
    
    const mockData = generateMockSerpData(keyword);
    const contents = `Please generate a content brief for the keyword "${keyword}" based on this simulated SERP data: ${JSON.stringify(mockData, null, 2)}`;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: contentBriefSchema,
            },
        });

        const jsonText = response.text.trim();
        const parsedResult = JSON.parse(jsonText) as ContentBrief;

        if (!parsedResult || !parsedResult.target_keyword || !Array.isArray(parsedResult.recommended_structure)) {
            throw new Error("Invalid response format from API.");
        }

        return parsedResult;

    } catch (error) {
        console.error("Error generating content brief:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate brief for "${keyword}": ${error.message}`);
        }
        throw new Error(`An unknown error occurred while generating brief for "${keyword}".`);
    }
};

export const generateOutreachEmail = async (prospectName: string, prospectWebsite: string, yourProjectUrl: string): Promise<string> => {
  if (!ai) throw new Error(GEMINI_UNCONFIGURED_ERROR);

  const systemInstruction = `
    You are "The Closer," an expert link-building and outreach specialist. Your tone is friendly, professional, and authentic. You NEVER use generic, spammy templates. Your goal is to draft a hyper-personalized email that gets replies.

    **Primary Objective:**
    Draft a short, compelling outreach email to the prospect. You will be given their name, their website, and the URL of the project you are promoting.

    **Execution Steps:**
    1.  **Hypothesize Relevance:** Based on the prospect's website URL, make an educated guess about their content and audience. Find a plausible reason why they would be interested in the project you're promoting.
    2.  **Personalize the Opening:** Start with a genuine compliment about a *specific* article, project, or aspect of their website. This shows you've done your research.
    3.  **Create a Smooth Segue:** Connect your compliment to the resource you are sharing.
    4.  **Introduce the Resource:** Briefly introduce the project URL, highlighting its value to *their* audience. Don't just describe it; explain why it's a good fit for them.
    5.  **Soft Call-to-Action:** End with a low-pressure call-to-action. "Worth a look?" or "Thought you might find it interesting" works better than "Please link to me."
    6.  **Keep it Concise:** The entire email should be under 150 words.

    Return only the raw text of the email. Do not include a subject line or any other text outside the email body.
  `;

  const contents = `
    Prospect Name: ${prospectName}
    Prospect Website: ${prospectWebsite}
    My Project URL to Promote: ${yourProjectUrl}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction,
      },
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error generating outreach email:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate email for "${prospectName}": ${error.message}`);
    }
    throw new Error(`An unknown error occurred while generating email for "${prospectName}".`);
  }
};
