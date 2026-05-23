"""Demo datasets for Market Opportunity Map.

Each row is grounded in public signals: Reddit / HackerNews threads, Lenny's
newsletter, NN/g, McKinsey/CareerKarma reports, vendor pricing pages, etc.
Sources are listed in comments above each row. Scores follow this scale:

    severity            1 = mild annoyance, 8 = workflow blocker, 10 = blocks core goal
    willingness_to_pay  1 = won't pay, 5 = $20–50/mo, 7 = $50–150/mo, 9 = enterprise budget
    competition_intensity  1 = no direct competitor, 8 = several established players, 10 = commoditized
    evidence_count      honest count of distinct credible sources actually found

Rows where evidence is thin (private communities, paywalled content) are
flagged "directional" in the notes and given a lower evidence_count.
"""


PRODUCT_ROWS = [
    # Freelance designers · Canva
    # sources:
    #   https://medium.com/design-bootcamp/why-youre-losing-clients-as-a-freelance-designer-73122409bb56
    #   https://alexberman.com/freelance-rate-graphic-designer
    #   https://www.canva.com/pricing/
    # notes: pain refined to designers' actual framing ("design as decoration");
    #        WTP 5 reflects freelance ceiling (~$20–50/mo).
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
    },

    # Startup founders · Notion
    # sources:
    #   https://news.ycombinator.com/item?id=14311953  (HN: "endless MVP" 1.5 years past sprint)
    #   https://www.f22labs.com/blogs/how-to-avoid-mistakes-founders-make-with-mvps/
    #   https://www.notion.com/templates/idea-to-mvp
    #   https://thoughtbot.com/blog/common-mistakes-founders-make-when-building-an-mvp-and-how-to-avoid-them
    # notes: real complaint is feature creep, not "choosing scope"; WTP 4 — founders are cheap.
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
    },

    # Product managers · Aha (Roadmaps)
    # sources:
    #   https://news.ycombinator.com/item?id=25899773  (HN: "Escaping the Roadmap Trap")
    #   https://news.ycombinator.com/item?id=22827275  (Ask HN on roadmap management)
    #   https://www.lennysnewsletter.com/p/mission-vision-strategy-goals-roadmap
    #   https://www.aha.io/roadmaps/pricing  (Premium starts at $59/user/mo)
    # notes: pain refined to "items don't trace to strategy"; Aha actively markets the fix.
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
    },

    # Product managers · Productboard
    # sources:
    #   https://news.ycombinator.com/item?id=22827275  (sales overrules roadmap; constant pushback)
    #   https://news.ycombinator.com/item?id=25899773  (roadmap-as-promise used against PMs)
    #   https://www.productplan.com/learn/roadmap-tips-align-stakeholders
    #   https://www.productboard.com/pricing/  (Pro $59/maker/mo)
    # notes: pain refined to "constant pushback" (not just "defending").
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
    },

    # UX researchers · Dovetail (repository)
    # sources:
    #   https://www.looppanel.com/blog/dovetail-alternatives  ("scattered Notion, Drive, Slack"; 80% of repositories fail)
    #   https://www.koji.so/blog/best-ux-research-repository-tools-2026
    #   https://dovetail.com/pricing/  (Free + Enterprise tiers; Pro ~$39/user/mo)
    # notes: pain specifies where insights scatter, as named in source.
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
    },

    # UX researchers · Dovetail (sharing)
    # sources:
    #   https://medium.com/design-bootcamp/breaking-the-silo-why-ux-research-gets-ignored-and-what-can-we-do-about-it-ad4b6e55d90d
    #   https://uxpsychology.substack.com/p/when-stakeholders-say-we-knew-that  (hindsight bias dismissing research)
    #   https://www.looppanel.com/blog/dovetail-alternatives  ("abandoned dumping grounds")
    #   https://dovetail.com/pricing/  (sharing features on Enterprise)
    # notes: pain refined to "filed but never influence decisions" — closes-the-loop gap.
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
    },

    # Indie hackers · Product Hunt
    # sources:
    #   https://www.indiehackers.com/post/finding-market-gaps-to-fill-with-ai-7807e78441
    #   https://nicheshunter.app/blog/app-ideas-indie-hackers-solo-devs-studios
    #   https://www.producthunt.com/about  (community-ranked discovery; free)
    # notes: refined to "worth building for" — signal vs noise framing.
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
    },

    # Indie hackers · Reddit
    # sources:
    #   https://www.indiehackers.com/post/a-few-thoughts-on-validating-startup-ideas-before-building-anything-d9e472ed0e
    #   https://www.indiehackers.com/post/how-to-validate-a-startup-idea-34f9df9d6b
    #   https://nomadvisamalta.com/discover-the-top-product-hunt-alternatives-for-indie-makers-in-2025/  (Reddit as validation channel)
    # notes: #1 reason indie projects fail — building unwanted things.
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
    },

    # Design leads · Figma (design system)
    # sources:
    #   https://www.nngroup.com/articles/ux-debt/  (NN/g: need visualizations to get leadership buy-in)
    #   https://blog.logrocket.com/ux-design/design-debt-is-slowing-you-down  ("strains internal relationships")
    #   https://dev.to/tlorent/technical-debt-will-bite-us-in-the-ass-how-to-make-non-technical-stakeholders-actually-care-2oef
    #   https://www.figma.com/pricing/  (design system on Professional+)
    # notes: pain refined to "make stakeholders care" — translation problem.
    #        Competition 4 — zeroheight does docs, not debt impact; mostly DIY decks today.
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
    },

    # Design leads · Figma (analytics)
    # sources:
    #   https://didoo.medium.com/measuring-the-impact-of-a-design-system-7f925af090f7  (Rastelli: invented custom metrics)
    #   https://medium.com/@theuxarchitect/measuring-design-roi-quantifying-the-impact-of-ux-in-large-organizations-9ce1af0e3336
    #   https://www.figma.com/pricing/  (org-wide analytics gated to Organization/Enterprise)
    # notes: pain refined to "quantify impact" — career-impacting for design leads.
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
    },

    # Heads of Product · Aha (portfolio)
    # sources:
    #   https://craft.io/guide/product-management-vs-portfolio-management/  ("no reliable way to see across portfolio")
    #   https://www.aha.io/roadmaps/pricing  (Enterprise+ tier gates OKRs, capacity, advanced analytics)
    # notes: evidence_count 2 — directional. Most Heads-of-Product discussion lives
    #        in gated communities (Lenny's Slack, Reforge), not public forums.
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
    },

    # Heads of Product · Productboard (strategy)
    # sources:
    #   https://www.lennysnewsletter.com/p/strategy-blocks-an-operators-guide  (Headspace: "teams confused about *why*")
    #   https://www.departmentofproduct.com/blog/5-ways-to-keep-teams-aligned-as-a-product-manager/  ("Google Drive until next quarter")
    #   https://www.productboard.com/pricing/productboard/  (Strategic planning Enterprise-only)
    # notes: WTP 9 — Productboard Enterprise deals run $70–100k/yr per Vendr data.
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
    },
]


EDTECH_ROWS = [
    # Career switchers · Coursera (certificates)
    # sources:
    #   https://www.coursera.org/professional-certificates  ($49/mo, 7-day trial)
    #   https://www.coursera.org/google-career-certificates  ("75% positive career outcome in 6 months")
    #   https://resumeworded.com/coursera-certificates-resume-key-advice  (cert alone often insufficient)
    # notes: WTP 5 — matches Coursera's $49/mo; budget-constrained segment.
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
    },

    # Career switchers · Codecademy (capstone)
    # sources:
    #   https://www.codecademy.com/pricing  (Basic free / Plus / Pro)
    #   https://www.codecademy.com/learn/paths/front-end-engineer-career-path  (3 capstone projects)
    #   https://discuss.codecademy.com/c/project/portfolio-project-reddit-project/1904  (everyone shipping same Reddit clone)
    # notes: "generic projects" framing matches the actual interview-funnel complaint.
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
    },

    # Bootcamp graduates · LinkedIn
    # sources:
    #   https://careerkarma.com/blog/state-of-the-bootcamp-market-report-2024-statistics-and-share-analysis/  (2023 layoffs 264k+; months in hiring)
    #   https://news.ycombinator.com/item?id=45235243  (HN: "graduated but no jobs")
    #   https://news.ycombinator.com/item?id=33825785  (hiring manager: "none passed initial screening")
    #   https://premium.linkedin.com/careers/compare-plans  (job search Free; Premium Career $39.99/mo)
    # notes: severity 9 — paid $10–20k, 4–6 months in, can't land a job.
    #        WTP 4 — cash-strapped post-bootcamp; only ISA-style outcome-tied pricing realistic.
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
    },

    # Bootcamp graduates · Reddit
    # sources:
    #   https://news.ycombinator.com/item?id=33825785  (real-experience gap)
    #   https://www.bestcolleges.com/bootcamps/guides/jobs-after-bootcamps/  (imposter syndrome as bigger risk than knowledge gap)
    # notes: evidence_count 2 — directional. Reddit-specific URLs not directly fetchable;
    #        leaning on HN + industry summaries that triangulate the same pain.
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
    },

    # Working professionals · Maven (cohorts)
    # sources:
    #   https://help.maven.com/en/articles/6732396-pricing-your-course  ($800–$2,500 typical, ~$500 avg)
    #   https://maven.com/courses  (cohort courses with set start dates)
    #   https://mavenanalytics.io/blog/cohort-learning-faq  (cohort 85–95% completion vs 5–15% self-paced)
    # notes: cohort completion data directly validates "no time / don't finish" pain.
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
    },

    # Working professionals · DeepLearning.AI
    # sources:
    #   https://learn.deeplearning.ai/membership  (Pro $25–30/mo; Free tier)
    #   https://www.deeplearning.ai/courses/  ("AI for Everyone" / "Generative AI for Everyone")
    #   https://www.mckinsey.com/capabilities/people-and-organizational-performance/our-insights/the-organization-blog/redefine-ai-upskilling-as-a-change-imperative  (77% of companies launching upskilling; >20% workforce reskilled in 3 years)
    # notes: pain sharpened to "fast without becoming an engineer" — actual non-technical framing.
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
    },

    # Self-taught learners · YouTube
    # sources:
    #   https://www.danielkliewer.com/blog/2025-10-21-learn-programming-computer-science-youtube-roadmap  ("tutorial hell" framing)
    #   r/learnprogramming community discussions (search-summary; "tutorial hell" is dominant idiom)
    #   https://www.youtube.com/howyoutubeworks/  (free; no curated roadmap)
    # notes: "tutorial hell" is the actual self-taught idiom. WTP 3 — free YouTube is the baseline.
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
        "evidence_count": 3,
    },

    # Self-taught learners · ChatGPT (tutoring)
    # sources:
    #   https://chatgpt.com/pricing/  (Free / Plus $20/mo / Pro)
    #   https://www.sciencedirect.com/science/article/pii/S2666920X24001127  (PyTutor: chat-based feedback less effective than IDE)
    #   https://www.mdpi.com/2227-7102/14/2/120  (ChatGPT for independent learners; documents value and limits)
    # notes: feedback gap partially mitigated by ChatGPT, hence severity 6 not 8.
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
    },

    # Aspiring PMs · Reforge
    # sources:
    #   https://reforge.helpscoutdocs.com/article/38-how-much-does-reforge-cost  (Individual $1,995/yr)
    #   https://www.landpmjob.com/reforge-review  ("zero job support, coaching, or placement")
    #   https://www.teamblind.com/post/Reforge-Course-for-PM-interview-prep-o4GHsXLY  (Blind: community questioning interview transfer)
    #   https://sirjohnnymai.com/blog/reforge-best-pm-courses-2026  ("doesn't have an interview prep course")
    # notes: WTP 7 — aspiring PMs spend $50–150/mo on Exponent/IGotAnOffer/Leland; Reforge itself $2k/yr.
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
    },

    # Aspiring PMs · Lenny's newsletter
    # sources:
    #   https://www.lennysnewsletter.com/about  (Substack subscription, $150/yr)
    #   https://aatir.substack.com/p/how-to-create-a-product-manager-portfolio
    #   https://medium.com/@akkineni.saibhavana/product-notes-by-sai-how-to-build-a-pm-portfolio-from-scratch-even-with-zero-pm-experience-e2108591bcac
    # notes: pain about job title proof. No one offers structured build-in-public PM portfolio product.
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
    },

    # L&D managers · LinkedIn Learning
    # sources:
    #   https://business.linkedin.com/learn/compare-plans  (AI learning plans + LMS/LXP on Enterprise)
    #   https://learning.linkedin.com/resources/learning-insights/business-value-linkedin-learning  (vendor's own ROI page)
    #   https://www.gpstrategies.com/wp-content/uploads/2025/09/GPStrategies_Measuring_the_Business_Impact_of_Learning_2025_Ebook_01_FULL.pdf  (90% of L&D struggle to prove business value)
    #   https://clo100.com/2025/12/16/kirkpatrick-level-4-ld-align-learning-with-business-kpis-for-measurable-roi/  (only ~24% reach Kirkpatrick Level 4)
    # notes: WTP 9 — enterprise L&D budgets six-figure ($380/seat × thousands).
    #        Severity 8 — #1 reason L&D budgets get cut.
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
    },

    # L&D managers · Pluralsight
    # sources:
    #   https://www.pluralsight.com/businesses/pricing  (6,500+ courses, 900+ paths, Skill IQ / Role IQ)
    #   G2/Capterra aggregated reviews ("non-tech content thin", "catalog goes stale")
    #   https://www.pluralsight.com/product/role-iq  (vendor's own attempt at role-mapping gap)
    # notes: pain refined to "doesn't map to our roles" — actual L&D language vs consumer "stale".
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
        "evidence_count": 3,
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
