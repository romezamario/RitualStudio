const DEFAULT_GITHUB_PRODUCTION_BRANCH = "main";
const DEFAULT_SUPABASE_WORKING_DIRECTORY = ".";
const DEFAULT_VERCEL_ENV_PREFIX = "NEXT_PUBLIC_";

function normalizeBooleanFlag(value: string | undefined, fallback: boolean) {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
}

function parseCsvList(value: string | undefined, fallback: string[]) {
  if (!value) {
    return fallback;
  }

  const list = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return list.length ? list : fallback;
}

export type IntegrationMetadata = {
  githubToSupabase: {
    connected: boolean;
    repository: string;
    workingDirectory: string;
    deployToProduction: boolean;
    productionBranch: string;
  };
  supabaseToVercel: {
    connected: boolean;
    team: string;
    project: string;
    syncEnvironments: string[];
    publicEnvPrefix: string;
  };
};

export function getIntegrationMetadata(): IntegrationMetadata {
  const githubRepository = process.env.NEXT_PUBLIC_GITHUB_REPOSITORY?.trim() ?? "";
  const supabaseWorkingDirectory =
    process.env.NEXT_PUBLIC_SUPABASE_WORKING_DIRECTORY?.trim() ?? DEFAULT_SUPABASE_WORKING_DIRECTORY;
  const githubProductionBranch =
    process.env.NEXT_PUBLIC_SUPABASE_PRODUCTION_BRANCH?.trim() ?? DEFAULT_GITHUB_PRODUCTION_BRANCH;

  const vercelTeam = process.env.NEXT_PUBLIC_VERCEL_TEAM?.trim() ?? "";
  const vercelProject = process.env.NEXT_PUBLIC_VERCEL_PROJECT?.trim() ?? "";

  return {
    githubToSupabase: {
      connected: Boolean(githubRepository),
      repository: githubRepository,
      workingDirectory: supabaseWorkingDirectory,
      deployToProduction: normalizeBooleanFlag(process.env.NEXT_PUBLIC_SUPABASE_DEPLOY_TO_PRODUCTION, true),
      productionBranch: githubProductionBranch,
    },
    supabaseToVercel: {
      connected: Boolean(vercelTeam && vercelProject),
      team: vercelTeam,
      project: vercelProject,
      syncEnvironments: parseCsvList(process.env.NEXT_PUBLIC_SUPABASE_VERCEL_SYNC_ENVS, ["production"]),
      publicEnvPrefix: process.env.NEXT_PUBLIC_VERCEL_ENV_PREFIX?.trim() ?? DEFAULT_VERCEL_ENV_PREFIX,
    },
  };
}

export function getSupabaseClientInfoHeader() {
  const metadata = getIntegrationMetadata();

  return [
    `ritualstudio-gh:${metadata.githubToSupabase.connected ? "on" : "off"}`,
    `ritualstudio-vercel:${metadata.supabaseToVercel.connected ? "on" : "off"}`,
    `branch:${metadata.githubToSupabase.productionBranch}`,
    `env-prefix:${metadata.supabaseToVercel.publicEnvPrefix}`,
  ].join(";");
}
