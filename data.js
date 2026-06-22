const FRAMEWORKS = [
  {
    id: "bluf",
    name: "BLUF",
    subtitle: "Bottom Line Up Front",
    desc: "Lead with the conclusion or ask, then provide supporting context. Borrowed from military communication — forces clarity and respects the reader's time.",
    steps: [
      { label: "B", text: "State your bottom line / recommendation / ask" },
      { label: "L", text: "Provide the key supporting logic (2-3 points max)" },
      { label: "U", text: "Add urgency or timeline if relevant" },
      { label: "F", text: "End with a clear next step or decision needed" }
    ],
    example: "\"We should delay the launch by one week. Two critical bugs remain in checkout, and fixing them post-launch would cost 3x in eng time. I need your sign-off by Thursday to adjust the go-to-market timeline.\""
  },
  {
    id: "pyramid",
    name: "Pyramid Principle",
    subtitle: "Minto's top-down structure",
    desc: "Start with the answer, then group supporting arguments, then data. Forces you to structure your thinking before speaking.",
    steps: [
      { label: "1", text: "State the answer / recommendation" },
      { label: "2", text: "Give 2-3 supporting arguments (grouped logically)" },
      { label: "3", text: "Back each argument with evidence/data" }
    ],
    example: "\"We should prioritize mobile onboarding this quarter. (1) 68% of new signups are mobile. (2) Mobile completion rate is 23% vs 71% desktop. (3) Competitor X just shipped a 2-step mobile flow and is gaining share.\""
  },
  {
    id: "scqa",
    name: "SCQA",
    subtitle: "Situation → Complication → Question → Answer",
    desc: "McKinsey storytelling framework. Builds narrative tension before revealing the recommendation — ideal for getting buy-in on non-obvious decisions.",
    steps: [
      { label: "S", text: "Situation: Describe the current stable state" },
      { label: "C", text: "Complication: What changed or is threatening" },
      { label: "Q", text: "Question: The key question this raises" },
      { label: "A", text: "Answer: Your recommended path forward" }
    ],
    example: "\"Our enterprise pipeline has grown 40% this year (S). But our avg deal cycle has stretched from 45 to 78 days (C). How do we close faster without discounting? (Q) I recommend a dedicated solutions engineering pod for top-10 deals (A).\""
  },
  {
    id: "sbi",
    name: "SBI",
    subtitle: "Situation → Behavior → Impact",
    desc: "Feedback framework that keeps observations specific and non-judgmental. Prevents vague or personal criticism.",
    steps: [
      { label: "S", text: "Situation: When and where it happened" },
      { label: "B", text: "Behavior: What specifically you observed" },
      { label: "I", text: "Impact: The effect it had" }
    ],
    example: "\"In yesterday's sprint review (S), you presented the demo without mentioning the known limitations (B). The stakeholders left with unrealistic expectations, and we got three urgent requests based on features that aren't ready (I).\""
  },
  {
    id: "star",
    name: "STAR",
    subtitle: "Situation → Task → Action → Result",
    desc: "Narrative framework for conveying impact. Use for status updates, retrospectives, and self-advocacy.",
    steps: [
      { label: "S", text: "Situation: Context and constraints" },
      { label: "T", text: "Task: What was your responsibility" },
      { label: "A", text: "Action: What specifically did you do" },
      { label: "R", text: "Result: Measurable outcome" }
    ],
    example: "\"Our checkout conversion dropped 12% after the redesign (S). I was tasked with diagnosing and fixing it within the sprint (T). I ran a funnel analysis, identified the payment step as the drop-off, and shipped a one-page checkout (A). Conversion recovered to +5% above baseline in two weeks (R).\""
  },
  {
    id: "onebreath",
    name: "One-Breath Rule",
    subtitle: "If you can't say it in one breath, simplify",
    desc: "Force yourself to deliver the core message in a single breath (~15 seconds). If you can't, the message isn't clear enough yet. Great for elevator pitches, stand-up updates, and exec asks.",
    steps: [
      { label: "1", text: "Draft your message" },
      { label: "2", text: "Cut until it fits in one breath" },
      { label: "3", text: "If you can't cut more, restructure" }
    ],
    example: "Before: \"So I've been looking at the data and I think we might want to consider the possibility of...\"\nAfter: \"We should cut feature X — it's used by 2% of users and blocking the Q3 release.\""
  }
];

const ANTI_PATTERNS = [
  {
    id: "hedging",
    name: "Hedging Language",
    desc: "Undermines your credibility and makes your message easy to ignore.",
    examples: [
      {
        bad: "I think maybe we should consider looking into the possibility of redesigning the onboarding flow.",
        good: "We should redesign the onboarding flow. Here's why and what I propose.",
        why: "Remove 'I think', 'maybe', 'consider', 'possibility of'. State your position directly."
      },
      {
        bad: "It might be worth exploring whether we could potentially shift our focus to mobile.",
        good: "I recommend we shift focus to mobile this quarter. Mobile signups are 68% of new users.",
        why: "Replace tentative language with a clear recommendation backed by data."
      },
      {
        bad: "I was kind of wondering if perhaps we could try a different approach here.",
        good: "I want to propose an alternative approach. The current plan has two risks.",
        why: "Own your suggestion. 'Kind of wondering' signals you don't believe in your own idea."
      }
    ]
  },
  {
    id: "burying",
    name: "Burying the Lead",
    desc: "Dumping context before stating the ask loses your audience in the first 30 seconds.",
    examples: [
      {
        bad: "So last week we had the offsite, and the team discussed a bunch of things, and one topic that came up was the timeline, and after looking at it more closely, I realized we might need to push the launch.",
        good: "We need to push the launch by two weeks. Here's why: [key reason]. I need your approval by Friday.",
        why: "Start with the conclusion (BLUF). Context comes second."
      },
      {
        bad: "I've been reviewing the metrics dashboard and noticed some interesting trends across several dimensions. Let me walk you through each one.",
        good: "Conversion dropped 15% this week. I've identified the root cause and have a fix. Here's my plan.",
        why: "Lead with the insight and action, not the process of discovery."
      }
    ]
  },
  {
    id: "passive",
    name: "Passive Voice Evasion",
    desc: "Using passive voice to avoid ownership or accountability. Makes it unclear who is responsible.",
    examples: [
      {
        bad: "It was decided that the feature would be deprioritized.",
        good: "I decided to deprioritize the feature because it conflicts with our Q3 goals.",
        why: "Name the decision-maker. If it was you, own it. If it was someone else, say who."
      },
      {
        bad: "The deadline was missed due to unforeseen circumstances.",
        good: "We missed the deadline because we underestimated the API integration complexity. Here's the revised timeline.",
        why: "Active voice + specific cause + path forward is always stronger."
      }
    ]
  },
  {
    id: "overqualifying",
    name: "Over-Qualifying",
    desc: "Prefacing statements with disclaimers that weaken your position before you've even made it.",
    examples: [
      {
        bad: "This is just my opinion, but I feel like we might want to think about user research.",
        good: "We need user research before committing to this direction. Here's what I'd propose.",
        why: "Drop 'just my opinion'. You were hired for your judgment — use it."
      },
      {
        bad: "I'm not an expert on this, but I was thinking that maybe the architecture could be simplified.",
        good: "I see an opportunity to simplify the architecture. Can I walk through my proposal with the tech lead?",
        why: "Don't disclaim expertise. Propose, then invite collaboration."
      }
    ]
  },
  {
    id: "vague_asks",
    name: "Vague Asks",
    desc: "Ending conversations without a clear, specific next step.",
    examples: [
      {
        bad: "Can we align on this?",
        good: "I need a yes/no on whether we proceed with option A by Thursday EOD.",
        why: "'Align' is vague. Specify exactly what decision you need and when."
      },
      {
        bad: "Let's circle back on this later.",
        good: "I'll send a proposal by Wednesday. Can we make a decision in Thursday's sync?",
        why: "Replace vague deferrals with a specific commitment and deadline."
      },
      {
        bad: "Thoughts?",
        good: "Do you see any blockers to shipping this next sprint? If not, I'll start the spec.",
        why: "Direct the response you need. 'Thoughts?' invites unfocused rambling."
      }
    ]
  },
  {
    id: "apologizing",
    name: "Unnecessary Apologies",
    desc: "Apologizing when no apology is needed undermines authority and wastes time.",
    examples: [
      {
        bad: "Sorry to bother you, but I have a question about the roadmap.",
        good: "Quick question about the roadmap — do you have 5 minutes?",
        why: "Asking questions is your job. Don't apologize for doing it."
      },
      {
        bad: "Sorry, I just wanted to follow up on the decision from last week.",
        good: "Following up on last week's decision — are we going with option B?",
        why: "Following up shows diligence, not imposition."
      }
    ]
  },
  {
    id: "solution_jumping",
    name: "Solution-Jumping",
    desc: "Presenting solutions without first framing the problem. Stakeholders can't evaluate a solution without understanding the problem.",
    examples: [
      {
        bad: "We should build a notification center.",
        good: "Users are missing critical updates because emails get buried. I propose a notification center — here's the cost-benefit analysis.",
        why: "Problem first, then solution. The problem creates the 'why' that makes the solution compelling."
      }
    ]
  }
];

const DRILL_SCENARIOS = {
  bluf_rewrite: [
    {
      scenario: "You're emailing your VP about a delayed feature. The engineering team found a critical dependency that wasn't scoped.",
      prompt: "Write a BLUF message to your VP about this delay.",
      hint: "Start with: what's happening + what you need. Then add 2-3 supporting points. End with the specific ask."
    },
    {
      scenario: "Your team discovered that a competitor just launched a feature you planned for next quarter. You want to accelerate the timeline.",
      prompt: "Write a BLUF message to your leadership team proposing to accelerate.",
      hint: "Lead with the recommendation and urgency. Support with competitive data. End with the specific decision you need."
    },
    {
      scenario: "Usage data shows your newly launched feature has 8% adoption after 30 days, below the 25% target.",
      prompt: "Write a BLUF update to stakeholders about the underperforming launch.",
      hint: "Don't hide bad news. Lead with the gap, your diagnosis, and your proposed action plan."
    },
    {
      scenario: "You need three engineers borrowed from another team for two sprints to hit a client commitment.",
      prompt: "Write a BLUF message to the other team's PM requesting the resources.",
      hint: "State what you need, why, the timeline, and what's in it for them or the company."
    }
  ],
  pyramid_structure: [
    {
      scenario: "Your CEO asks: 'Should we enter the European market this year?'",
      prompt: "Structure a Pyramid Principle response with a clear recommendation and 3 supporting arguments.",
      hint: "Answer first (yes/no + timing). Then 3 grouped arguments (market size, competitive landscape, operational readiness). Each backed by one data point."
    },
    {
      scenario: "A stakeholder asks why you're recommending to sunset a feature that 500 users still use.",
      prompt: "Use the Pyramid Principle to defend your recommendation.",
      hint: "Recommendation → (1) usage trend, (2) maintenance cost, (3) migration path. Each with a specific number."
    }
  ],
  scqa_framing: [
    {
      scenario: "Your team's velocity has dropped 30% over three sprints but no one has raised it officially.",
      prompt: "Frame this issue using SCQA to present at the next leadership meeting.",
      hint: "S: team was delivering X per sprint. C: dropped 30% over 3 sprints. Q: what's causing this and how do we fix it? A: your proposed investigation/fix."
    },
    {
      scenario: "Customer churn increased from 5% to 12% but revenue is up because of enterprise deals.",
      prompt: "Use SCQA to frame this for the exec team — it's a hidden risk that could be dismissed.",
      hint: "S: revenue is up. C: but churn doubled and it's masked by a few big deals. Q: are we building a sustainable business? A: your proposal."
    }
  ],
  antipattern_fix: [
    {
      original: "Sorry to jump in, but I was kind of thinking that maybe we should perhaps consider the possibility that the timeline might be a little aggressive, if that's okay with everyone?",
      prompt: "Rewrite this to be direct and confident.",
      hint: "Remove all hedging. State the concern, the reason, and your proposed alternative."
    },
    {
      original: "So I've been doing a lot of research over the past few weeks, looking at various data sources, talking to different teams, and I've noticed some interesting patterns that I think could be relevant to our discussion about the product strategy.",
      prompt: "Rewrite this using BLUF — lead with the insight.",
      hint: "What did you find? Say that first. The process of finding it is not interesting to your audience."
    },
    {
      original: "It was determined by the team that the original approach wasn't going to work, and it was felt that a new direction should be explored, and some concerns were raised about the timeline implications.",
      prompt: "Rewrite this in active voice with clear ownership.",
      hint: "Who determined? Who felt? Who raised concerns? Name names (or say 'I') and be specific."
    },
    {
      original: "I'm not sure if this is the right forum, and I apologize if this has been covered before, but I just wanted to flag that I have some thoughts on the pricing strategy that I'd love to share if people are interested?",
      prompt: "Rewrite this to project confidence and authority.",
      hint: "You were invited to this meeting. Your perspective matters. State it directly."
    },
    {
      original: "Can we align on the path forward? I think we need to circle back and make sure everyone is on the same page before we move too far ahead on this.",
      prompt: "Rewrite with a specific ask and deadline.",
      hint: "What specific decision do you need? From whom? By when?"
    },
    {
      original: "Thoughts?",
      prompt: "Replace this with a specific, directed question that gets you actionable feedback.",
      hint: "What specific input do you need? Ask for exactly that."
    }
  ],
  quiz: [
    {
      question: "Your VP asks for a project update in a meeting. What's the best opening?",
      options: [
        "Let me walk you through everything we've done since last month...",
        "We're on track to ship by March 15. Two risks to flag: API dependency and QA bandwidth.",
        "So there's been a lot of progress and some challenges I want to discuss...",
        "Before I start, I want to provide some context about the team's situation."
      ],
      correct: 1,
      explanation: "BLUF: Lead with status (on track / at risk / blocked) and the 1-2 things that need attention. Context can follow if asked."
    },
    {
      question: "Which response best handles a stakeholder requesting a feature that conflicts with your roadmap?",
      options: [
        "That's a great idea! Let me see if we can fit it in.",
        "I appreciate the suggestion. That feature conflicts with our Q3 priorities. Here's what I'd propose instead, and I'd like to discuss the trade-offs.",
        "I'm not sure that's something we can do right now, but maybe later?",
        "Let me think about it and get back to you."
      ],
      correct: 1,
      explanation: "Acknowledge, state the conflict directly, offer an alternative, and invite discussion. Don't promise what you can't deliver or defer without a plan."
    },
    {
      question: "You need to give tough feedback to a peer PM. Which approach follows SBI?",
      options: [
        "You're always unprepared for stakeholder meetings.",
        "In Tuesday's exec review, you didn't have the conversion data ready when the CEO asked. It made the team look uninformed and we lost credibility on the project.",
        "I feel like you could be more prepared sometimes.",
        "Some people have mentioned that your preparation could be better."
      ],
      correct: 1,
      explanation: "SBI: Specific situation (Tuesday's exec review), specific behavior (didn't have data ready), specific impact (lost credibility). No generalizations ('always'), no vague sourcing ('some people')."
    },
    {
      question: "Which is the strongest way to close a decision-making meeting?",
      options: [
        "Does anyone have any other thoughts?",
        "Let's align offline.",
        "Decision: we go with option B. I'll send the spec by Friday. Objections, raise them now.",
        "I think we're all on the same page, right?"
      ],
      correct: 2,
      explanation: "State the decision, the next step with owner and deadline, and create a clear window for objections. Everything else is vague."
    },
    {
      question: "You're presenting a risky recommendation. What's the best framing?",
      options: [
        "I know this might be controversial, but...",
        "This is just an idea, but what if we...",
        "I recommend X. The main risk is Y, and here's how I'd mitigate it.",
        "Sorry if this is a bad suggestion, but have we considered..."
      ],
      correct: 2,
      explanation: "Own the recommendation. Acknowledge risks proactively with mitigation — that's leadership. Don't apologize for having a point of view."
    },
    {
      question: "A cross-functional partner says \"let's circle back on this.\" What's the best PM response?",
      options: [
        "Sounds good, let's do that.",
        "Sure, when works for you?",
        "I want to resolve this today. Can we take 5 more minutes? If not, I'll send a proposal by EOD and need your response by tomorrow noon.",
        "Okay, I'll follow up sometime."
      ],
      correct: 2,
      explanation: "Don't let vague deferrals kill momentum. Pin down the next step with a deadline. 'Circle back' without a date means 'never.'"
    },
    {
      question: "What's wrong with this stakeholder update: \"The project is going well overall. We've made good progress on several fronts.\"?",
      options: [
        "Nothing — it's a concise positive update.",
        "It's too vague — no specifics on what progress, no metrics, no risks flagged.",
        "It's too short — stakeholders want more detail.",
        "It should start with an apology for the delay in updating."
      ],
      correct: 1,
      explanation: "Vague positivity erodes trust. Stakeholders need specifics: what shipped, what's at risk, what decisions are needed. 'Good progress' is meaningless without evidence."
    },
    {
      question: "Your manager asks you to justify your team's headcount in a planning meeting. Best approach?",
      options: [
        "We need more people because the team is overloaded.",
        "Here's what we shipped with current headcount, what we had to cut, and what we could deliver with N+2 — with expected revenue impact.",
        "Other teams have more people than us.",
        "I'll put together a document and send it later."
      ],
      correct: 1,
      explanation: "Pyramid Principle: conclusion (need N+2), then evidence grouped by output/tradeoffs/ROI. Never argue headcount from feelings ('overloaded') or comparisons ('other teams')."
    }
  ],
  one_breath: [
    {
      scenario: "Explain to your CEO why you want to kill a feature that took 3 months to build.",
      prompt: "Say it in one breath (~15 seconds, ~2 sentences max).",
      hint: "What feature, why kill it (one data point), what you'll do instead."
    },
    {
      scenario: "Your skip-level asks: 'What's the biggest risk to your product right now?'",
      prompt: "Answer in one breath.",
      hint: "Name the risk, quantify the impact, state what you're doing about it."
    },
    {
      scenario: "An engineer asks why their feature request keeps getting deprioritized.",
      prompt: "Explain in one breath without being dismissive.",
      hint: "Acknowledge the value, state what's ahead of it and why, offer a realistic timeline."
    },
    {
      scenario: "A sales rep asks you to explain your product's value prop to a prospect in an elevator.",
      prompt: "Deliver the pitch in one breath.",
      hint: "Who it's for, what problem it solves, one proof point."
    }
  ],
  stakeholder_sim: [
    {
      context: "You're in a roadmap review. The Head of Sales interrupts: \"Why aren't we building the CRM integration? I've had three enterprise deals fall through because of this.\"",
      prompt: "Write your response. Balance empathy with strategic clarity.",
      hint: "Acknowledge the impact (lost deals are real). Explain the trade-off without being dismissive. Offer a concrete next step (timeline, workaround, or follow-up conversation)."
    },
    {
      context: "Your engineering lead says in standup: \"I don't understand why we're building this feature. No one has explained the business case.\"",
      prompt: "Respond in a way that rebuilds trust and alignment.",
      hint: "Own the gap in communication. Provide the business case in 2-3 sentences. Offer to do a proper kickoff if needed."
    },
    {
      context: "In a planning meeting, your manager says: \"I don't think this initiative is ambitious enough for your level. If you want to be promoted, you need to think bigger.\"",
      prompt: "Respond constructively without being defensive.",
      hint: "Thank them for the feedback. Ask a clarifying question about what 'bigger' means. Propose a way to expand scope while managing risk."
    },
    {
      context: "A designer on your team comes to you frustrated: \"Engineering keeps changing the specs without telling me. I redesigned the same flow three times.\"",
      prompt: "Respond as the PM who needs to fix the process without taking sides.",
      hint: "Validate the frustration. Take ownership of the process gap. Propose a specific fix (e.g., change review step, notification). Don't blame engineering."
    }
  ]
};
