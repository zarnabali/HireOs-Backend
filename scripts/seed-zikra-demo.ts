import dotenv from 'dotenv';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

dotenv.config();
Object.assign(globalThis, { WebSocket: require('ws') });

type RecruiterSeed = {
  email: string;
  password: string;
  fullName: string;
  title: string;
  memberRole: 'owner' | 'admin' | 'recruiter';
};

type JobSeed = {
  title: string;
  department: string;
  location: string;
  remote_type: 'onsite' | 'hybrid' | 'remote';
  employment_type: 'full_time' | 'part_time' | 'contract' | 'internship';
  seniority: 'intern' | 'junior' | 'mid' | 'senior' | 'lead' | 'principal';
  min_salary: number;
  max_salary: number;
  required_skills: string[];
  nice_to_have_skills: string[];
  description: string;
};

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in backend/.env');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const companySeed = {
  name: 'Zikra Infortech',
  website: 'https://zikrainfortech.com',
  industry: 'Software, AI, Cloud, and Digital Transformation',
  size_range: '51-200',
  description:
    'Zikra Infortech is a technology company building AI-powered business platforms, cloud-native applications, automation systems, and data products for fast-growing teams.'
};

const recruiters: RecruiterSeed[] = [
  {
    email: 'ayesha.malik@zikrainfortech.com',
    password: 'ZikraRecruiter1#2026',
    fullName: 'Ayesha Malik',
    title: 'Head of Talent Acquisition',
    memberRole: 'owner'
  },
  {
    email: 'hamza.qureshi@zikrainfortech.com',
    password: 'ZikraRecruiter2#2026',
    fullName: 'Hamza Qureshi',
    title: 'Technical Recruiter',
    memberRole: 'admin'
  },
  {
    email: 'sana.iqbal@zikrainfortech.com',
    password: 'ZikraRecruiter3#2026',
    fullName: 'Sana Iqbal',
    title: 'Recruiter Operations Specialist',
    memberRole: 'recruiter'
  }
];

const jobs: JobSeed[] = [
  {
    title: 'Backend Engineer - Node.js',
    department: 'Engineering',
    location: 'Islamabad, Pakistan',
    remote_type: 'hybrid',
    employment_type: 'full_time',
    seniority: 'mid',
    min_salary: 280000,
    max_salary: 420000,
    required_skills: ['Node.js', 'TypeScript', 'REST APIs', 'PostgreSQL', 'Express'],
    nice_to_have_skills: ['Supabase', 'Redis', 'Docker', 'Event-driven architecture'],
    description:
      'Build secure backend services for hiring workflows, job marketplace features, recruiter dashboards, and candidate applications. You will design REST APIs, write maintainable TypeScript services, integrate with PostgreSQL/Supabase, and improve reliability through validation, observability, and tests.'
  },
  {
    title: 'Senior Python FastAPI Engineer',
    department: 'AI Engineering',
    location: 'Remote',
    remote_type: 'remote',
    employment_type: 'full_time',
    seniority: 'senior',
    min_salary: 450000,
    max_salary: 650000,
    required_skills: ['Python', 'FastAPI', 'Pydantic', 'PostgreSQL', 'API design'],
    nice_to_have_skills: ['LangGraph', 'Celery', 'Redis', 'OpenAI API'],
    description:
      'Own Python services that power document extraction, resume analysis, scoring workflows, and AI-assisted hiring experiences. The role focuses on typed schemas, reliable async processing, clean service boundaries, and production-grade API behavior.'
  },
  {
    title: 'Frontend Engineer - Next.js',
    department: 'Product Engineering',
    location: 'Lahore, Pakistan',
    remote_type: 'hybrid',
    employment_type: 'full_time',
    seniority: 'mid',
    min_salary: 260000,
    max_salary: 420000,
    required_skills: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'API integration'],
    nice_to_have_skills: ['shadcn/ui', 'GSAP', 'Accessibility', 'React Query'],
    description:
      'Create polished candidate and recruiter product screens for an AI hiring platform. You will build dashboards, forms, job search flows, resume interfaces, and AI result views with clean state management and strong attention to usability.'
  },
  {
    title: 'Full Stack Product Engineer',
    department: 'Product Engineering',
    location: 'Karachi, Pakistan',
    remote_type: 'hybrid',
    employment_type: 'full_time',
    seniority: 'senior',
    min_salary: 380000,
    max_salary: 580000,
    required_skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'System design'],
    nice_to_have_skills: ['Supabase', 'Next.js', 'FastAPI', 'CI/CD'],
    description:
      'Work across frontend and backend to ship complete product capabilities, from job posting and applications to resume workflows and recruiter analytics. You should be comfortable turning ambiguous product requirements into maintainable implementation.'
  },
  {
    title: 'DevOps Engineer',
    department: 'Infrastructure',
    location: 'Islamabad, Pakistan',
    remote_type: 'hybrid',
    employment_type: 'full_time',
    seniority: 'mid',
    min_salary: 320000,
    max_salary: 520000,
    required_skills: ['Docker', 'Linux', 'CI/CD', 'Cloud deployments', 'Monitoring'],
    nice_to_have_skills: ['Kubernetes', 'Terraform', 'AWS', 'Railway', 'Render'],
    description:
      'Improve deployment pipelines, runtime reliability, environment management, and monitoring for backend, frontend, and AI services. You will help standardize builds, automate releases, and reduce operational risk.'
  },
  {
    title: 'Cloud Infrastructure Engineer',
    department: 'Infrastructure',
    location: 'Remote',
    remote_type: 'remote',
    employment_type: 'full_time',
    seniority: 'senior',
    min_salary: 420000,
    max_salary: 700000,
    required_skills: ['AWS', 'Networking', 'Security', 'Docker', 'Infrastructure as Code'],
    nice_to_have_skills: ['Kubernetes', 'Terraform', 'Supabase', 'Cost optimization'],
    description:
      'Design and maintain cloud infrastructure for scalable SaaS products. Responsibilities include secure networking, containerized deployments, production monitoring, backup planning, and cost-aware architecture decisions.'
  },
  {
    title: 'Data Engineer',
    department: 'Data',
    location: 'Lahore, Pakistan',
    remote_type: 'hybrid',
    employment_type: 'full_time',
    seniority: 'mid',
    min_salary: 300000,
    max_salary: 520000,
    required_skills: ['SQL', 'Python', 'ETL', 'PostgreSQL', 'Data modeling'],
    nice_to_have_skills: ['dbt', 'Airflow', 'Supabase', 'Vector databases'],
    description:
      'Build reliable data pipelines, reporting models, and analytics foundations for hiring intelligence. You will model jobs, resumes, applications, and recruiter activity into trustworthy datasets for dashboards and AI workflows.'
  },
  {
    title: 'Machine Learning Engineer',
    department: 'AI Engineering',
    location: 'Remote',
    remote_type: 'remote',
    employment_type: 'full_time',
    seniority: 'senior',
    min_salary: 480000,
    max_salary: 780000,
    required_skills: ['Python', 'Machine Learning', 'Embeddings', 'Evaluation', 'MLOps'],
    nice_to_have_skills: ['OpenAI API', 'LangChain', 'LangGraph', 'pgvector'],
    description:
      'Build and evaluate AI capabilities for resume understanding, semantic job matching, candidate ranking, and recommendation quality. The role requires strong judgment around model evaluation, bias reduction, and explainable outputs.'
  },
  {
    title: 'AI Integration Engineer',
    department: 'AI Engineering',
    location: 'Islamabad, Pakistan',
    remote_type: 'hybrid',
    employment_type: 'full_time',
    seniority: 'mid',
    min_salary: 350000,
    max_salary: 570000,
    required_skills: ['LLM APIs', 'Prompt engineering', 'Python', 'JSON schemas', 'API integration'],
    nice_to_have_skills: ['LangGraph', 'OpenAI Assistants', 'Celery', 'Redis'],
    description:
      'Integrate LLM-powered workflows into production systems while keeping outputs structured, validated, and cost-aware. You will work on resume extraction, interview generation, recruiter chat, and career assistant capabilities.'
  },
  {
    title: 'QA Automation Engineer',
    department: 'Quality Engineering',
    location: 'Karachi, Pakistan',
    remote_type: 'hybrid',
    employment_type: 'full_time',
    seniority: 'mid',
    min_salary: 220000,
    max_salary: 360000,
    required_skills: ['Playwright', 'API testing', 'Test planning', 'TypeScript', 'Bug reporting'],
    nice_to_have_skills: ['Vitest', 'CI pipelines', 'Accessibility testing', 'Performance testing'],
    description:
      'Create automated test coverage for critical hiring flows including authentication, job browsing, applications, resume upload, recruiter job management, and AI result screens. You will help define quality gates before release.'
  },
  {
    title: 'Mobile App Developer - React Native',
    department: 'Product Engineering',
    location: 'Remote',
    remote_type: 'remote',
    employment_type: 'full_time',
    seniority: 'mid',
    min_salary: 260000,
    max_salary: 440000,
    required_skills: ['React Native', 'TypeScript', 'Mobile UI', 'API integration', 'App performance'],
    nice_to_have_skills: ['Expo', 'Push notifications', 'Supabase Auth', 'Offline storage'],
    description:
      'Build mobile experiences for candidates and recruiters, including job discovery, application tracking, recruiter notifications, and AI assistant interactions. Strong product sense and mobile performance awareness are important.'
  },
  {
    title: 'UI/UX Product Designer',
    department: 'Design',
    location: 'Lahore, Pakistan',
    remote_type: 'hybrid',
    employment_type: 'full_time',
    seniority: 'mid',
    min_salary: 220000,
    max_salary: 380000,
    required_skills: ['Product design', 'Figma', 'User flows', 'Design systems', 'Prototyping'],
    nice_to_have_skills: ['Hiring products', 'Dashboard design', 'UX research', 'Motion design'],
    description:
      'Design elegant workflows for job seekers and recruiters across dashboards, resume intelligence, candidate review, interview preparation, and AI chat. You will translate complex AI results into clear, trustworthy product interfaces.'
  },
  {
    title: 'Product Manager - Hiring Platform',
    department: 'Product',
    location: 'Islamabad, Pakistan',
    remote_type: 'hybrid',
    employment_type: 'full_time',
    seniority: 'senior',
    min_salary: 420000,
    max_salary: 650000,
    required_skills: ['Product strategy', 'SaaS', 'User research', 'Roadmapping', 'Analytics'],
    nice_to_have_skills: ['Recruiting workflows', 'AI products', 'Marketplace products', 'SQL'],
    description:
      'Own product planning for candidate and recruiter workflows, from discovery through delivery. You will define requirements, prioritize features, analyze usage data, and coordinate engineering, design, and business stakeholders.'
  },
  {
    title: 'Business Analyst',
    department: 'Product',
    location: 'Karachi, Pakistan',
    remote_type: 'hybrid',
    employment_type: 'full_time',
    seniority: 'mid',
    min_salary: 200000,
    max_salary: 330000,
    required_skills: ['Requirements analysis', 'Process mapping', 'SQL basics', 'Documentation', 'Stakeholder communication'],
    nice_to_have_skills: ['HR tech', 'Agile delivery', 'Analytics dashboards', 'API documentation'],
    description:
      'Bridge business requirements and product implementation for hiring workflows. You will document use cases, acceptance criteria, operational processes, reporting needs, and edge cases for engineering teams.'
  },
  {
    title: 'Cybersecurity Analyst',
    department: 'Security',
    location: 'Remote',
    remote_type: 'remote',
    employment_type: 'full_time',
    seniority: 'mid',
    min_salary: 300000,
    max_salary: 500000,
    required_skills: ['Security monitoring', 'OWASP', 'Access control', 'Incident response', 'Risk assessment'],
    nice_to_have_skills: ['Cloud security', 'Supabase security', 'SOC2 readiness', 'Penetration testing'],
    description:
      'Help protect sensitive candidate, recruiter, and company data across the platform. Responsibilities include access review, vulnerability triage, security controls, incident response preparation, and secure development guidance.'
  },
  {
    title: 'Database Administrator - PostgreSQL',
    department: 'Data',
    location: 'Islamabad, Pakistan',
    remote_type: 'hybrid',
    employment_type: 'full_time',
    seniority: 'senior',
    min_salary: 360000,
    max_salary: 600000,
    required_skills: ['PostgreSQL', 'Query optimization', 'Backups', 'RLS', 'Schema design'],
    nice_to_have_skills: ['Supabase', 'pgvector', 'Migration tooling', 'Performance tuning'],
    description:
      'Maintain PostgreSQL data reliability, performance, and access control for a multi-role hiring platform. You will optimize queries, review schema changes, monitor database health, and improve migration discipline.'
  },
  {
    title: 'Technical Project Manager',
    department: 'Delivery',
    location: 'Lahore, Pakistan',
    remote_type: 'hybrid',
    employment_type: 'full_time',
    seniority: 'senior',
    min_salary: 350000,
    max_salary: 560000,
    required_skills: ['Project planning', 'Agile delivery', 'Risk management', 'Technical communication', 'Stakeholder management'],
    nice_to_have_skills: ['SaaS delivery', 'AI projects', 'Jira', 'Release management'],
    description:
      'Coordinate cross-functional delivery for product, backend, frontend, AI services, and infrastructure initiatives. You will keep releases predictable, clarify dependencies, and ensure teams have actionable execution plans.'
  },
  {
    title: 'Customer Success Engineer',
    department: 'Customer Success',
    location: 'Remote',
    remote_type: 'remote',
    employment_type: 'full_time',
    seniority: 'mid',
    min_salary: 220000,
    max_salary: 390000,
    required_skills: ['Technical support', 'API debugging', 'Customer communication', 'SaaS onboarding', 'SQL basics'],
    nice_to_have_skills: ['HR tech', 'Zapier', 'CRM tools', 'Workflow automation'],
    description:
      'Support business customers through onboarding, technical troubleshooting, workflow configuration, and product education. You will partner with engineering to reproduce issues and improve customer-facing documentation.'
  },
  {
    title: 'Sales Development Representative',
    department: 'Sales',
    location: 'Karachi, Pakistan',
    remote_type: 'onsite',
    employment_type: 'full_time',
    seniority: 'junior',
    min_salary: 120000,
    max_salary: 220000,
    required_skills: ['Outbound sales', 'Lead qualification', 'CRM usage', 'Email outreach', 'Communication'],
    nice_to_have_skills: ['B2B SaaS', 'Recruiting industry', 'LinkedIn Sales Navigator', 'Cold calling'],
    description:
      'Generate qualified opportunities for Zikra Infortech products and services. You will research prospects, run outbound sequences, qualify business needs, and book meetings for account executives.'
  },
  {
    title: 'Digital Marketing Specialist',
    department: 'Marketing',
    location: 'Lahore, Pakistan',
    remote_type: 'hybrid',
    employment_type: 'full_time',
    seniority: 'mid',
    min_salary: 180000,
    max_salary: 320000,
    required_skills: ['SEO', 'Content marketing', 'Paid campaigns', 'Analytics', 'Social media'],
    nice_to_have_skills: ['B2B SaaS', 'HubSpot', 'Google Ads', 'Conversion optimization'],
    description:
      'Plan and execute campaigns that grow awareness, traffic, and qualified leads. You will manage content, paid channels, SEO improvements, campaign reporting, and positioning for AI and software services.'
  },
  {
    title: 'HR and Talent Acquisition Specialist',
    department: 'People',
    location: 'Islamabad, Pakistan',
    remote_type: 'hybrid',
    employment_type: 'full_time',
    seniority: 'mid',
    min_salary: 180000,
    max_salary: 300000,
    required_skills: ['Recruiting', 'Screening', 'Interview coordination', 'HR operations', 'Candidate experience'],
    nice_to_have_skills: ['Technical hiring', 'ATS tools', 'Employer branding', 'Compensation benchmarking'],
    description:
      'Manage hiring operations from sourcing to offer coordination. You will screen candidates, schedule interviews, maintain pipeline data, support onboarding, and improve the candidate experience.'
  },
  {
    title: 'Finance Operations Associate',
    department: 'Finance',
    location: 'Karachi, Pakistan',
    remote_type: 'onsite',
    employment_type: 'full_time',
    seniority: 'junior',
    min_salary: 140000,
    max_salary: 240000,
    required_skills: ['Bookkeeping', 'Excel', 'Invoicing', 'Expense tracking', 'Financial reporting'],
    nice_to_have_skills: ['QuickBooks', 'Payroll support', 'SaaS finance', 'Procurement'],
    description:
      'Support finance operations including invoices, expense tracking, vendor records, payroll coordination, and management reporting. Accuracy, confidentiality, and reliable follow-through are essential.'
  },
  {
    title: 'Technical Support Engineer',
    department: 'Support',
    location: 'Remote',
    remote_type: 'remote',
    employment_type: 'full_time',
    seniority: 'junior',
    min_salary: 160000,
    max_salary: 280000,
    required_skills: ['Troubleshooting', 'APIs', 'Logs', 'Customer support', 'Documentation'],
    nice_to_have_skills: ['JavaScript', 'PostgreSQL', 'SaaS platforms', 'Help desk tools'],
    description:
      'Resolve technical issues for users and internal teams by investigating logs, reproducing bugs, explaining product behavior, and escalating clear reports to engineering when needed.'
  },
  {
    title: 'Blockchain Engineer',
    department: 'Emerging Technology',
    location: 'Remote',
    remote_type: 'remote',
    employment_type: 'contract',
    seniority: 'mid',
    min_salary: 350000,
    max_salary: 650000,
    required_skills: ['Solidity', 'Smart contracts', 'Web3.js', 'Security awareness', 'Node.js'],
    nice_to_have_skills: ['EVM', 'Hardhat', 'Auditing', 'Wallet integrations'],
    description:
      'Build and review blockchain integrations, smart contracts, and wallet-enabled workflows for client projects. You should understand secure contract development, testing, and tradeoffs in decentralized systems.'
  },
  {
    title: 'Software Engineer Intern',
    department: 'Engineering',
    location: 'Islamabad, Pakistan',
    remote_type: 'onsite',
    employment_type: 'internship',
    seniority: 'intern',
    min_salary: 45000,
    max_salary: 70000,
    required_skills: ['JavaScript', 'Git', 'HTML', 'CSS', 'Problem solving'],
    nice_to_have_skills: ['React', 'Node.js', 'TypeScript', 'SQL'],
    description:
      'Join the engineering team as an intern and work on supervised product tasks, bug fixes, internal tools, and learning projects. This role is suited for candidates who can learn quickly and communicate clearly.'
  }
];

function isAlreadyRegisteredError(message: string): boolean {
  return message.toLowerCase().includes('already') || message.toLowerCase().includes('registered');
}

async function findAuthUserByEmail(client: SupabaseClient, email: string): Promise<User | null> {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 });

    if (error) {
      throw new Error(`Failed to list auth users while finding ${email}: ${error.message}`);
    }

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email.toLowerCase());
    if (user) {
      return user;
    }

    if (data.users.length < 1000) {
      break;
    }
  }

  return null;
}

async function ensureCompany(client: SupabaseClient) {
  const { data: existing, error: selectError } = await client
    .from('companies')
    .select('id')
    .eq('name', companySeed.name)
    .limit(1)
    .maybeSingle();

  if (selectError) {
    throw new Error(`Failed to find company: ${selectError.message}`);
  }

  if (existing) {
    const { data, error } = await client
      .from('companies')
      .update(companySeed)
      .eq('id', existing.id)
      .select('id, name')
      .single();

    if (error) {
      throw new Error(`Failed to update company: ${error.message}`);
    }

    return data;
  }

  const { data, error } = await client.from('companies').insert(companySeed).select('id, name').single();

  if (error) {
    throw new Error(`Failed to create company: ${error.message}`);
  }

  return data;
}

async function ensureRecruiter(client: SupabaseClient, companyId: string, recruiter: RecruiterSeed) {
  let authUser = await findAuthUserByEmail(client, recruiter.email);

  if (!authUser) {
    const { data, error } = await client.auth.admin.createUser({
      email: recruiter.email,
      password: recruiter.password,
      email_confirm: true,
      user_metadata: {
        full_name: recruiter.fullName,
        role: 'recruiter'
      },
      app_metadata: {
        role: 'recruiter'
      }
    });

    if (error) {
      if (!isAlreadyRegisteredError(error.message)) {
        throw new Error(`Failed to create auth user ${recruiter.email}: ${error.message}`);
      }

      authUser = await findAuthUserByEmail(client, recruiter.email);
      if (!authUser) {
        throw new Error(`Auth user ${recruiter.email} already exists but could not be loaded`);
      }
    } else {
      authUser = data.user;
    }
  }

  if (!authUser) {
    throw new Error(`Auth user ${recruiter.email} could not be created or loaded`);
  }

  const { error: updateAuthError } = await client.auth.admin.updateUserById(authUser.id, {
    password: recruiter.password,
    email_confirm: true,
    user_metadata: {
      full_name: recruiter.fullName,
      role: 'recruiter'
    },
    app_metadata: {
      role: 'recruiter'
    }
  });

  if (updateAuthError) {
    throw new Error(`Failed to update auth credentials for ${recruiter.email}: ${updateAuthError.message}`);
  }

  const { error: userError } = await client.from('users').upsert(
    {
      id: authUser.id,
      email: recruiter.email,
      full_name: recruiter.fullName,
      role: 'recruiter'
    },
    { onConflict: 'id' }
  );

  if (userError) {
    throw new Error(`Failed to upsert public user ${recruiter.email}: ${userError.message}`);
  }

  const { error: profileError } = await client.from('recruiter_profiles').upsert(
    {
      user_id: authUser.id,
      company_id: companyId,
      title: recruiter.title,
      timezone: 'Asia/Karachi'
    },
    { onConflict: 'user_id' }
  );

  if (profileError) {
    throw new Error(`Failed to upsert recruiter profile ${recruiter.email}: ${profileError.message}`);
  }

  const { error: membershipError } = await client.from('company_members').upsert(
    {
      company_id: companyId,
      user_id: authUser.id,
      role: recruiter.memberRole
    },
    { onConflict: 'company_id,user_id' }
  );

  if (membershipError) {
    throw new Error(`Failed to upsert company membership ${recruiter.email}: ${membershipError.message}`);
  }

  return {
    id: authUser.id,
    email: recruiter.email,
    fullName: recruiter.fullName,
    title: recruiter.title,
    companyRole: recruiter.memberRole
  };
}

async function ensureJob(client: SupabaseClient, companyId: string, job: JobSeed) {
  const payload = {
    ...job,
    company_id: companyId,
    currency: 'PKR',
    status: 'open'
  };

  const { data: existing, error: selectError } = await client
    .from('jobs')
    .select('id')
    .eq('company_id', companyId)
    .eq('title', job.title)
    .limit(1)
    .maybeSingle();

  if (selectError) {
    throw new Error(`Failed to find job ${job.title}: ${selectError.message}`);
  }

  if (existing) {
    const { data, error } = await client.from('jobs').update(payload).eq('id', existing.id).select('id, title').single();

    if (error) {
      throw new Error(`Failed to update job ${job.title}: ${error.message}`);
    }

    return data;
  }

  const { data, error } = await client.from('jobs').insert(payload).select('id, title').single();

  if (error) {
    throw new Error(`Failed to create job ${job.title}: ${error.message}`);
  }

  return data;
}

async function main() {
  const company = await ensureCompany(supabase);
  const seededRecruiters = [];

  for (const recruiter of recruiters) {
    seededRecruiters.push(await ensureRecruiter(supabase, company.id, recruiter));
  }

  const seededJobs = [];

  for (const job of jobs) {
    seededJobs.push(await ensureJob(supabase, company.id, job));
  }

  const { count: openJobCount, error: countError } = await supabase
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', company.id)
    .eq('status', 'open');

  if (countError) {
    throw new Error(`Failed to verify open job count: ${countError.message}`);
  }

  console.log(
    JSON.stringify(
      {
        company,
        recruiters: seededRecruiters.map((recruiter) => ({
          email: recruiter.email,
          fullName: recruiter.fullName,
          title: recruiter.title,
          companyRole: recruiter.companyRole
        })),
        createdOrUpdatedJobs: seededJobs.length,
        openJobsForCompany: openJobCount,
        credentials: recruiters.map((recruiter) => ({
          email: recruiter.email,
          password: recruiter.password
        }))
      },
      null,
      2
    )
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Seed failed: ${message}`);
  process.exitCode = 1;
});
