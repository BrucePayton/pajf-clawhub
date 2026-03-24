export interface CaseStep {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
}

export interface MetricCard {
  id: string;
  label: string;
  value: string;
  subtext: string;
  icon: 'clock' | 'calendar' | 'zap' | 'trending-up';
}

export interface RoadmapItem {
  id: string;
  task: string;
  content: string;
  date: string;
}

export type Organization = '财服总部' | '深圳分公司' | '上海分公司' | '合肥分公司' | '成都分公司' | '内江分公司';

export interface Case {
  id: string;
  title: string;
  subtitle: string;
  status: 'draft' | 'published';
  version?: number;
  lastModified?: number;
  author: string;
  umNumber: string;
  team: string;
  organization: Organization;
  ownerId?: string;
  isPublic?: boolean;
  likeCount?: number;
  likedByKeys?: string[];

  // Section 01: Challenges - 可选字段，提供 null 安全性
  challenges?: {
    background?: string;
    painPoints?: string[];
    objectives?: string;
  };

  // Section 02: Implementation - 可选字段，提供 null 安全性
  implementation?: {
    steps?: CaseStep[];
  };

  // Section 03: Business Value - 可选字段，提供 null 安全性
  businessValue?: {
    metrics?: MetricCard[];
    footerNote?: string;
  };

  // Section 04: Future Roadmap - 可选字段，提供 null 安全性
  roadmap?: {
    items?: RoadmapItem[];
  };
}

export interface DbConfig {
  host: string;
  port: number;
  user: string;
  password?: string;
  database: string;
}
