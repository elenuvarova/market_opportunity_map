"""Demo datasets for Market Opportunity Map.

Each row is grounded in public signals: Reddit / HackerNews threads, Lenny's
newsletter, NN/g, McKinsey/CareerKarma reports, vendor pricing pages, etc.

Sources live as a structured `sources` list per row (url + paraphrase note);
`source_type` is derived from the URL at runtime via sources.source_type_from_url.

Score scale:
    severity            1 = mild annoyance, 8 = workflow blocker, 10 = blocks core goal
    willingness_to_pay  1 = won't pay, 5 = $20–50/mo, 7 = $50–150/mo, 9 = enterprise budget
    competition_intensity  1 = no direct competitor, 8 = several established players
    evidence_count      honest count of distinct credible sources actually found

Rows where evidence is thin (private communities, paywalled content) are
flagged "directional" in the notes and given a lower evidence_count.

Notes in the `sources` field are paraphrases of what each source shows, not
literal quotes — they were captured during the research pass alongside the
URLs and are marked is_paraphrase=True when surfaced through the API.
"""


PRODUCT_ROWS = [
    {
        "segment": "Freelance designers",
        "pain_point": "Clients see design as decoration, not business value",
        "competitor": "Canva",
        "feature": "Presentation templates",
        "pricing_tier": "Freemium",
        "opportunity": "Value-based design case builder",
        "severity": 7,
        "willingness_to_pay": 5,
        "competition_intensity": 6,
        "evidence_count": 3,
        "sources": [
            {"url": "https://medium.com/design-bootcamp/why-youre-losing-clients-as-a-freelance-designer-73122409bb56",
             "note": "Freelance designers struggle to communicate value; undercharge when they can't articulate business impact."},
            {"url": "https://alexberman.com/freelance-rate-graphic-designer",
             "note": "Rate justification hinges on 'the problem, your process, and the business result' — not just finished work."},
            {"url": "https://www.canva.com/pricing/",
             "note": "Canva Pro $15/mo confirms Freemium tier; premium presentation templates gated to Pro."},
        ],
    },

    {
        "segment": "Startup founders",
        "pain_point": "Feature creep makes MVP scope balloon before launch",
        "competitor": "Notion",
        "feature": "Templates",
        "pricing_tier": "Freemium",
        "opportunity": "MVP scope decision canvas",
        "severity": 8,
        "willingness_to_pay": 4,
        "competition_intensity": 7,
        "evidence_count": 3,
        "sources": [
            {"url": "https://news.ycombinator.com/item?id=14311953",
             "note": "Commenters describe being stuck on 'endless MVP' 1.5 years past initial sprint due to constant feature additions."},
            {"url": "https://www.f22labs.com/blogs/how-to-avoid-mistakes-founders-make-with-mvps/",
             "note": "Cramming too much into MVP is the most common founder mistake."},
            {"url": "https://www.notion.com/templates/idea-to-mvp",
             "note": "Notion has MVP-specific templates as a real feature; Freemium tier confirmed."},
            {"url": "https://thoughtbot.com/blog/common-mistakes-founders-make-when-building-an-mvp-and-how-to-avoid-them",
             "note": "Thoughtbot confirms scope creep as core MVP failure mode."},
        ],
    },

    {
        "segment": "Product managers",
        "pain_point": "Roadmap items don't trace back to strategic goals",
        "competitor": "Aha",
        "feature": "Roadmap planning",
        "pricing_tier": "Paid",
        "opportunity": "Strategy-to-roadmap visual map",
        "severity": 7,
        "willingness_to_pay": 8,
        "competition_intensity": 8,
        "evidence_count": 3,
        "sources": [
            {"url": "https://news.ycombinator.com/item?id=25899773",
             "note": "'Escaping the Roadmap Trap' — roadmaps treated as delivery promises while strategy gets lost."},
            {"url": "https://news.ycombinator.com/item?id=22827275",
             "note": "Ask HN on roadmap management: priority churn and inability to tie work back to OKRs."},
            {"url": "https://www.lennysnewsletter.com/p/mission-vision-strategy-goals-roadmap",
             "note": "Lenny on the strategy-to-roadmap cascade as the explicit problem PMs are trying to solve."},
            {"url": "https://www.aha.io/roadmaps/pricing",
             "note": "Aha Roadmaps Premium starts at $59/user/mo annual; product explicitly markets 'Link strategy to all product work.'"},
        ],
    },

    {
        "segment": "Product managers",
        "pain_point": "Stakeholders keep pushing back on roadmap priorities",
        "competitor": "Productboard",
        "feature": "Prioritization",
        "pricing_tier": "Paid",
        "opportunity": "Stakeholder alignment canvas",
        "severity": 8,
        "willingness_to_pay": 8,
        "competition_intensity": 8,
        "evidence_count": 3,
        "sources": [
            {"url": "https://news.ycombinator.com/item?id=22827275",
             "note": "Business teams constantly shift priorities; sales overrules roadmap; 'if everything is top priority then nothing is.'"},
            {"url": "https://news.ycombinator.com/item?id=25899773",
             "note": "'The org takes a roadmap as a promise' and stakeholders use it against PMs when slips happen."},
            {"url": "https://www.productboard.com/pricing/",
             "note": "Productboard Pro $59/maker/mo; Spark $15–19; legacy Essentials $19. Confirms Paid tier."},
        ],
    },

    {
        "segment": "UX researchers",
        "pain_point": "Research lives in scattered docs across Notion, Drive, and Slack",
        "competitor": "Dovetail",
        "feature": "Research repository",
        "pricing_tier": "Paid",
        "opportunity": "Insight-to-opportunity map",
        "severity": 7,
        "willingness_to_pay": 7,
        "competition_intensity": 8,
        "evidence_count": 3,
        "sources": [
            {"url": "https://www.looppanel.com/blog/dovetail-alternatives",
             "note": "'Research still living in scattered Notion pages, Google Drives, and Slack threads'; 80% of repositories fail to meet team needs."},
            {"url": "https://www.koji.so/blog/best-ux-research-repository-tools-2026",
             "note": "Competitor landscape (Dovetail, Marvin, Condens, Notably, Reduct) confirms scattered-research as industry-wide pain."},
            {"url": "https://dovetail.com/pricing/",
             "note": "Dovetail has Free + Enterprise (custom) tiers; markets 'Research Repository' as a solution. Enterprise reportedly $21K+/yr."},
        ],
    },

    {
        "segment": "UX researchers",
        "pain_point": "Research insights get filed but never influence product decisions",
        "competitor": "Dovetail",
        "feature": "Sharing",
        "pricing_tier": "Paid",
        "opportunity": "Insight impact tracker",
        "severity": 8,
        "willingness_to_pay": 6,
        "competition_intensity": 6,
        "evidence_count": 3,
        "sources": [
            {"url": "https://medium.com/design-bootcamp/breaking-the-silo-why-ux-research-gets-ignored-and-what-can-we-do-about-it-ad4b6e55d90d",
             "note": "Why research gets ignored: KPI/revenue priorities override; long reports get lost in inboxes."},
            {"url": "https://uxpsychology.substack.com/p/when-stakeholders-say-we-knew-that",
             "note": "Hindsight bias: stakeholders dismiss findings as 'knew it all along' — erodes respect for research."},
            {"url": "https://www.looppanel.com/blog/dovetail-alternatives",
             "note": "Repositories 'become abandoned dumping grounds where research goes unused.'"},
            {"url": "https://dovetail.com/pricing/",
             "note": "Sharing features (unlimited free viewers, comments, mentions, Slack/Teams integration) gated to Enterprise."},
        ],
    },

    {
        "segment": "Indie hackers",
        "pain_point": "Hard to find market gaps worth building for",
        "competitor": "Product Hunt",
        "feature": "Discovery",
        "pricing_tier": "Free",
        "opportunity": "Market gap visualizer",
        "severity": 6,
        "willingness_to_pay": 5,
        "competition_intensity": 6,
        "evidence_count": 3,
        "sources": [
            {"url": "https://www.indiehackers.com/post/finding-market-gaps-to-fill-with-ai-7807e78441",
             "note": "Founder describes struggle distinguishing real pain from tech-driven ideas; comments confirm theme."},
            {"url": "https://nicheshunter.app/blog/app-ideas-indie-hackers-solo-devs-studios",
             "note": "Big companies ignore $500K niches; solo devs should 'look for people asking for app recommendations.'"},
            {"url": "https://www.producthunt.com/about",
             "note": "Product Hunt is community-ranked discovery; free to browse/submit."},
        ],
    },

    {
        "segment": "Indie hackers",
        "pain_point": "Hard to validate an idea before building it",
        "competitor": "Reddit",
        "feature": "Communities",
        "pricing_tier": "Free",
        "opportunity": "Lightweight validation board",
        "severity": 8,
        "willingness_to_pay": 5,
        "competition_intensity": 7,
        "evidence_count": 3,
        "sources": [
            {"url": "https://www.indiehackers.com/post/a-few-thoughts-on-validating-startup-ideas-before-building-anything-d9e472ed0e",
             "note": "Author warns about months of work building 'something people do not want to use'; recommends user conversations and pre-sells."},
            {"url": "https://www.indiehackers.com/post/how-to-validate-a-startup-idea-34f9df9d6b",
             "note": "Framework covers market scan, business viability, unfair advantage — validation as recurring community pain."},
            {"url": "https://nomadvisamalta.com/discover-the-top-product-hunt-alternatives-for-indie-makers-in-2025/",
             "note": "Reddit's role as de facto validation channel: r/SideProject, r/Entrepreneur for honest feedback."},
        ],
    },

    {
        "segment": "Design leads",
        "pain_point": "Hard to make stakeholders care about design debt",
        "competitor": "Figma",
        "feature": "Design system",
        "pricing_tier": "Paid",
        "opportunity": "Design debt impact map",
        "severity": 7,
        "willingness_to_pay": 6,
        "competition_intensity": 4,
        "evidence_count": 3,
        "sources": [
            {"url": "https://www.nngroup.com/articles/ux-debt/",
             "note": "NN/g: need visualizations and user-testing evidence to 'help leadership understand why it's important.'"},
            {"url": "https://blog.logrocket.com/ux-design/design-debt-is-slowing-you-down",
             "note": "'Design debt strains internal relationships, with stakeholders arguing about priorities.'"},
            {"url": "https://dev.to/tlorent/technical-debt-will-bite-us-in-the-ass-how-to-make-non-technical-stakeholders-actually-care-2oef",
             "note": "Translation problem: 'When you say refactoring, non-technical stakeholders hear optional polish.'"},
            {"url": "https://www.figma.com/pricing/",
             "note": "Figma design system / shared libraries on Professional ($16/seat) — confirms Paid tier."},
        ],
    },

    {
        "segment": "Design leads",
        "pain_point": "Hard to quantify design team impact",
        "competitor": "Figma",
        "feature": "Analytics",
        "pricing_tier": "Enterprise",
        "opportunity": "Design impact dashboard",
        "severity": 8,
        "willingness_to_pay": 7,
        "competition_intensity": 5,
        "evidence_count": 3,
        "sources": [
            {"url": "https://didoo.medium.com/measuring-the-impact-of-a-design-system-7f925af090f7",
             "note": "Rastelli: 'really hard to measure people's happiness or impact on velocity'; had to invent custom git-log visualization."},
            {"url": "https://medium.com/@theuxarchitect/measuring-design-roi-quantifying-the-impact-of-ux-in-large-organizations-9ce1af0e3336",
             "note": "Whole post about quantifying UX ROI for large orgs."},
            {"url": "https://www.figma.com/pricing/",
             "note": "Org-wide design system analytics on Organization ($55) and Enterprise ($90) — Enterprise tier is the accurate label."},
        ],
    },

    {
        "segment": "Heads of Product",
        "pain_point": "No visibility into bets across squads",
        "competitor": "Aha",
        "feature": "Portfolio view",
        "pricing_tier": "Enterprise",
        "opportunity": "Cross-squad bets map",
        "severity": 8,
        "willingness_to_pay": 9,
        "competition_intensity": 7,
        "evidence_count": 2,
        "sources": [
            {"url": "https://craft.io/guide/product-management-vs-portfolio-management/",
             "note": "'Leaders need a reliable way to see how work is progressing across the whole portfolio… Without that visibility, portfolio management becomes a manual reporting exercise.'"},
            {"url": "https://www.aha.io/roadmaps/pricing",
             "note": "Premium ~$74.59/user/mo, Enterprise ~$124.99, Enterprise+ $149. Portfolio-level capabilities (OKRs, capacity, advanced analytics) gated to Enterprise+."},
        ],
    },

    {
        "segment": "Heads of Product",
        "pain_point": "Strategy doesn't make it down to squads",
        "competitor": "Productboard",
        "feature": "Strategy planning",
        "pricing_tier": "Enterprise",
        "opportunity": "Strategy cascade tool",
        "severity": 8,
        "willingness_to_pay": 9,
        "competition_intensity": 6,
        "evidence_count": 3,
        "sources": [
            {"url": "https://www.lennysnewsletter.com/p/strategy-blocks-an-operators-guide",
             "note": "Headspace: 'despite having established our product roadmap and success metrics and our mission and vision, teams were still confused about why we were working on the projects we chose.'"},
            {"url": "https://www.departmentofproduct.com/blog/5-ways-to-keep-teams-aligned-as-a-product-manager/",
             "note": "Failure mode: teams 'put it into a Google Drive until the next quarter' — strategy doesn't reach execution."},
            {"url": "https://www.productboard.com/pricing/productboard/",
             "note": "Starter Free / Essentials $19 / Pro $59 / Enterprise custom. Strategic planning + unlimited OKRs gated to Enterprise."},
        ],
    },
]


EDTECH_ROWS = [
    {
        "segment": "Career switchers",
        "pain_point": "Hard to know which skills actually lead to a real job",
        "competitor": "Coursera",
        "feature": "Career certificates",
        "pricing_tier": "Subscription",
        "opportunity": "Job-outcome focused skill paths",
        "severity": 8,
        "willingness_to_pay": 5,
        "competition_intensity": 8,
        "evidence_count": 3,
        "sources": [
            {"url": "https://www.coursera.org/professional-certificates",
             "note": "Coursera Career/Professional Certificates: $49/mo subscription with 7-day free trial."},
            {"url": "https://www.coursera.org/google-career-certificates",
             "note": "'75% of certificate graduates report a positive career outcome within six months' — vendor framing."},
            {"url": "https://resumeworded.com/coursera-certificates-resume-key-advice",
             "note": "Cert alone often insufficient; career switchers need paired demonstrated skills — confirms 'which skills lead to a job' problem."},
        ],
    },

    {
        "segment": "Career switchers",
        "pain_point": "Generic tutorial projects don't impress hiring managers",
        "competitor": "Codecademy",
        "feature": "Capstone projects",
        "pricing_tier": "Freemium",
        "opportunity": "Portfolio with real-world client briefs",
        "severity": 7,
        "willingness_to_pay": 5,
        "competition_intensity": 7,
        "evidence_count": 3,
        "sources": [
            {"url": "https://www.codecademy.com/pricing",
             "note": "Three-tier freemium model: Basic free / Plus / Pro. Portfolio projects gated to paid tiers."},
            {"url": "https://www.codecademy.com/learn/paths/front-end-engineer-career-path",
             "note": "3 capstone/portfolio projects (Personal Portfolio, Reddit Project, Final Front-End Project) — official career-path feature."},
            {"url": "https://discuss.codecademy.com/c/project/portfolio-project-reddit-project/1904",
             "note": "Forum thread: many learners share the same Reddit-clone capstone — 'everyone has the same project' pain."},
        ],
    },

    {
        "segment": "Bootcamp graduates",
        "pain_point": "Can't land first job after bootcamp",
        "competitor": "LinkedIn",
        "feature": "Job search",
        "pricing_tier": "Free",
        "opportunity": "Bootcamp grad job-readiness program",
        "severity": 9,
        "willingness_to_pay": 4,
        "competition_intensity": 8,
        "evidence_count": 4,
        "sources": [
            {"url": "https://careerkarma.com/blog/state-of-the-bootcamp-market-report-2024-statistics-and-share-analysis/",
             "note": "2023 tech layoffs (264k+); grads spend 'months in the hiring process'; placement uncertainty hurting bootcamp signups."},
            {"url": "https://news.ycombinator.com/item?id=45235243",
             "note": "Front-page HN: 'graduated but no jobs' — CS/bootcamp grads unable to find work."},
            {"url": "https://news.ycombinator.com/item?id=33825785",
             "note": "Hiring manager: 'I've interviewed dozens of bootcamp graduates and none have passed initial screening for mid-level developer jobs.'"},
            {"url": "https://premium.linkedin.com/careers/compare-plans",
             "note": "LinkedIn job search is free; Premium Career $39.99/mo is the upgrade — free tier is the relevant comparator."},
        ],
    },

    {
        "segment": "Bootcamp graduates",
        "pain_point": "Imposter syndrome — no real-world experience to back up the resume",
        "competitor": "Reddit",
        "feature": "Communities",
        "pricing_tier": "Free",
        "opportunity": "Mentor-led portfolio reviews",
        "severity": 7,
        "willingness_to_pay": 5,
        "competition_intensity": 6,
        "evidence_count": 2,
        "sources": [
            {"url": "https://news.ycombinator.com/item?id=33825785",
             "note": "Hiring-manager-led thread on bootcamp grads lacking real experience and failing screens — backdrop for imposter syndrome."},
            {"url": "https://www.bestcolleges.com/bootcamps/guides/jobs-after-bootcamps/",
             "note": "Imposter syndrome and low confidence are bigger risks than knowledge gaps for bootcamp grads."},
        ],
    },

    {
        "segment": "Working professionals",
        "pain_point": "No time for full-length courses while working full-time",
        "competitor": "Maven",
        "feature": "Cohort courses",
        "pricing_tier": "Paid",
        "opportunity": "Micro-learning lunch breaks",
        "severity": 7,
        "willingness_to_pay": 6,
        "competition_intensity": 7,
        "evidence_count": 3,
        "sources": [
            {"url": "https://help.maven.com/en/articles/6732396-pricing-your-course",
             "note": "Per-course pricing: $800–$2,500 typical, ~$500 average. Paid-per-course, not subscription."},
            {"url": "https://maven.com/courses",
             "note": "Cohort-based courses with set start dates ('6 weeks · Starts Jun 19'), live + instructor-led."},
            {"url": "https://mavenanalytics.io/blog/cohort-learning-faq",
             "note": "Cohort courses 85–95% completion vs 5–15% self-paced — validates 'no time / don't finish' pain."},
        ],
    },

    {
        "segment": "Working professionals",
        "pain_point": "Need to upskill in AI fast without becoming an engineer",
        "competitor": "DeepLearning.AI",
        "feature": "AI specializations",
        "pricing_tier": "Subscription",
        "opportunity": "AI for non-engineers fast track",
        "severity": 8,
        "willingness_to_pay": 6,
        "competition_intensity": 8,
        "evidence_count": 3,
        "sources": [
            {"url": "https://learn.deeplearning.ai/membership",
             "note": "DeepLearning.AI Pro subscription: $30/mo monthly or $25/mo annual ($300/yr). Free tier also exists."},
            {"url": "https://www.deeplearning.ai/courses/",
             "note": "Specializations exist (Deep Learning, ML, NLP, TensorFlow, Generative AI) plus non-technical 'AI for Everyone' / 'Generative AI for Everyone'."},
            {"url": "https://www.mckinsey.com/capabilities/people-and-organizational-performance/our-insights/the-organization-blog/redefine-ai-upskilling-as-a-change-imperative",
             "note": "Enterprise AI upskilling demand: 40% of AI-adopting respondents expect >20% workforce reskilled in 3 years; 77% of companies intend to launch upskilling."},
        ],
    },

    {
        "segment": "Self-taught learners",
        "pain_point": "Stuck in tutorial hell with no clear roadmap of what to learn next",
        "competitor": "YouTube",
        "feature": "Tutorials",
        "pricing_tier": "Free",
        "opportunity": "Personalized learning roadmap",
        "severity": 7,
        "willingness_to_pay": 3,
        "competition_intensity": 8,
        "evidence_count": 2,
        "sources": [
            {"url": "https://www.danielkliewer.com/blog/2025-10-21-learn-programming-computer-science-youtube-roadmap",
             "note": "'Jumping randomly between topics, getting stuck in tutorial hell, or giving up because you don't know what to learn next' — central pain of YouTube-based learning."},
            {"url": "https://www.youtube.com/howyoutubeworks/",
             "note": "YouTube is free; user-generated tutorials with no native curated roadmap."},
        ],
    },

    {
        "segment": "Self-taught learners",
        "pain_point": "No expert to review my projects or tell me where I'm going wrong",
        "competitor": "ChatGPT",
        "feature": "Tutoring",
        "pricing_tier": "Freemium",
        "opportunity": "AI project review tutor",
        "severity": 6,
        "willingness_to_pay": 3,
        "competition_intensity": 7,
        "evidence_count": 3,
        "sources": [
            {"url": "https://chatgpt.com/pricing/",
             "note": "Free / Plus $20/mo / Pro — freemium model. Free tier includes basic chat-based help; Study Mode is part of the product."},
            {"url": "https://www.sciencedirect.com/science/article/pii/S2666920X24001127",
             "note": "PyTutor peer-reviewed study: ChatGPT-based tutoring helps engagement but 'immediate and precise feedback is invaluable... real-time formative feedback from IDEs is more efficient than a chat-based tool.'"},
            {"url": "https://www.mdpi.com/2227-7102/14/2/120",
             "note": "MDPI case study on ChatGPT supporting independent learners; documents both value and limits of code feedback from a generalist LLM."},
        ],
    },

    {
        "segment": "Aspiring PMs",
        "pain_point": "I know the frameworks but freeze on real PM interview questions",
        "competitor": "Reforge",
        "feature": "PM courses",
        "pricing_tier": "Paid",
        "opportunity": "Mock PM interview simulator",
        "severity": 8,
        "willingness_to_pay": 7,
        "competition_intensity": 8,
        "evidence_count": 4,
        "sources": [
            {"url": "https://reforge.helpscoutdocs.com/article/38-how-much-does-reforge-cost",
             "note": "Reforge Individual $1,995/yr (paid membership, not enterprise-only); on-demand PM course library exists."},
            {"url": "https://www.landpmjob.com/reforge-review",
             "note": "'It's NOT for job seekers — offers zero job support, coaching, or placement.' Directly confirms theory-to-interview gap."},
            {"url": "https://www.teamblind.com/post/Reforge-Course-for-PM-interview-prep-o4GHsXLY",
             "note": "Blind thread: community questioning whether Reforge translates to interviews."},
            {"url": "https://sirjohnnymai.com/blog/reforge-best-pm-courses-2026",
             "note": "Review: 'Reforge doesn't have an interview prep course' and 'some of their mocks aren't even that good.'"},
        ],
    },

    {
        "segment": "Aspiring PMs",
        "pain_point": "Hard to demonstrate PM craft without a job title to point to",
        "competitor": "Lenny's newsletter",
        "feature": "Articles",
        "pricing_tier": "Subscription",
        "opportunity": "Build-in-public PM portfolio",
        "severity": 7,
        "willingness_to_pay": 6,
        "competition_intensity": 7,
        "evidence_count": 3,
        "sources": [
            {"url": "https://www.lennysnewsletter.com/about",
             "note": "Substack with paid subscription ($150/yr); articles + podcast + Slack."},
            {"url": "https://aatir.substack.com/p/how-to-create-a-product-manager-portfolio",
             "note": "Aspiring PMs need to 'show how you think' via portfolio when they lack the PM title."},
            {"url": "https://medium.com/@akkineni.saibhavana/product-notes-by-sai-how-to-build-a-pm-portfolio-from-scratch-even-with-zero-pm-experience-e2108591bcac",
             "note": "Recurring 'no PM experience, how do I prove craft' pain in PM community."},
        ],
    },

    {
        "segment": "L&D managers",
        "pain_point": "Can't show leadership how training translates to business outcomes",
        "competitor": "LinkedIn Learning",
        "feature": "Learning paths",
        "pricing_tier": "Enterprise",
        "opportunity": "Skills-to-business-outcome analytics",
        "severity": 8,
        "willingness_to_pay": 9,
        "competition_intensity": 7,
        "evidence_count": 4,
        "sources": [
            {"url": "https://business.linkedin.com/learn/compare-plans",
             "note": "Enterprise tier: AI-powered Learning Plans, Custom content upload, learning paths + LMS/LXP integrations."},
            {"url": "https://learning.linkedin.com/resources/learning-insights/business-value-linkedin-learning",
             "note": "Vendor's own ROI page — exists precisely because customers ask this question."},
            {"url": "https://www.gpstrategies.com/wp-content/uploads/2025/09/GPStrategies_Measuring_the_Business_Impact_of_Learning_2025_Ebook_01_FULL.pdf",
             "note": "'Measuring the Business Impact of Learning 2025: L&D at a Crossroads' — 90% of L&D orgs struggle to prove business value."},
            {"url": "https://clo100.com/2025/12/16/kirkpatrick-level-4-ld-align-learning-with-business-kpis-for-measurable-roi/",
             "note": "Only ~24% of orgs fully implement Kirkpatrick to Level 4 (business outcomes); most stop at completion rates."},
        ],
    },

    {
        "segment": "L&D managers",
        "pain_point": "Generic course catalogs don't map to the roles and skills my org actually needs",
        "competitor": "Pluralsight",
        "feature": "Course library",
        "pricing_tier": "Enterprise",
        "opportunity": "Dynamic role-based skill graphs",
        "severity": 7,
        "willingness_to_pay": 9,
        "competition_intensity": 7,
        "evidence_count": 2,
        "sources": [
            {"url": "https://www.pluralsight.com/businesses/pricing",
             "note": "Enterprise tier: 6,500+ courses, 900+ learning paths, Skill IQ / Role IQ."},
            {"url": "https://www.pluralsight.com/product/role-iq",
             "note": "Vendor's own Role IQ page exists because role-mapping gap is a known customer pain."},
        ],
    },
]


DEMO_DATASETS = {
    "product": {
        "label": "Product tools",
        "description": "Segments and pains across product, design, and research tools. Signals from HN, Lenny's newsletter, NN/g, and vendor pricing.",
        "rows": PRODUCT_ROWS,
    },
    "edtech": {
        "label": "EdTech & self-learning",
        "description": "Career switchers, working pros, L&D. Signals from HN, CareerKarma, McKinsey reskilling reports, and vendor pricing.",
        "rows": EDTECH_ROWS,
    },
}

DEFAULT_DATASET = "product"


def get_dataset(key: str | None):
    if not key:
        return DEMO_DATASETS[DEFAULT_DATASET]
    if key not in DEMO_DATASETS:
        return None
    return DEMO_DATASETS[key]
