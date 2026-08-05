export const ROUTES = {
  //PROGRAMME
  VIEW_PROGRAMMES: '/programmeManagement/viewAll',
  VIEW_PROGRAMME: '/programmeManagement/view/',
  PROGRAMME_DETAILS_BY_ID: (id: string) => `/programmeManagement/view/${id}`,
  PROGRAMME_DETAILS_BY_REF_ID: (refId: string) => `/programmeManagement/view/${refId}`,
  //PROGRAMME_DETAILS_BY_PROGRAMME_ID: (programId: string) => `/programmeManagement/view/${programId}`,
  ADD_PROGRAMME: '/programmeManagement/addProgramme',
  ADD_INVESTMENT_TO_PROGRAMME: '/programmeManagement/addInvestment',
  // PROGRAMME VIEW -> INF VIEW
  INF_VIEW: (id: string) => `/programmeManagement/addProgramme/${id}`,
  //USERS
  VIEW_USERS: '/userManagement/viewAll',
  VIEW_USER_PROFILE: '/userProfile/view',
  UPDATE_USER: '/userManagement/updateUser',
  ADD_NEW_USER: '/userManagement/addUSer',
  //AUTH
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgotPassword',
  //COST_QUOTATION
  COST_QUOTATION_VIEW: (programmeId: string | number) => `/programmeManagement/addCostQuotation/${programmeId}`,
  //PROJECT-PROPOSAL
  PROJECT_PROPOSAL_VIEW: (programmeId: string | number) =>
    `/programmeManagement/projectProposal/${programmeId}`,
  //CMA
  CMA_FORM: (programmeId: string | number) => `/programmeManagement/pdd/${programmeId}`,
  // PDD
  PDD_FORM: (refId: string | number) => `/programmeManagement/pdd/${refId}`,
  //VALIDATION
  VALIDATION_AGREEMENT: (programmeId: string | number) =>
    `/programmeManagement/validationAgreement/${programmeId}`,
  VALIDATION_REPORT: (programmeId: string | number) => `/programmeManagement/validationReport/${programmeId}`,
  //MONITORING-REPORT
  MONITORING_REPORT_CREATE: (id: string) => `/programmeManagement/monitoringReport/${id}`,
  MONITORING_REPORT_CREATE_BY_PROGRAMME_ID: (programmeId: string | number) =>
    `/programmeManagement/monitoringReport/${programmeId}`,
  MONITORING_REPORT_ACTION: (programmeId: string | number, verificationRequestId: string | number) =>
    `/programmeManagement/monitoringReport/${programmeId}/${verificationRequestId}`,
  //VERIFICATION-REPORT
  VERIFICATION_REPORT: (programmeId: string | number) =>
    `/programmeManagement/verificationReport/${programmeId}`,
  VERIFICATION_REPORT_ACTION: (programmeId: string | number, verificationRequestId: string | number) =>
    `/programmeManagement/verificationReport/${programmeId}/${verificationRequestId}`,
  //DASHBOARD
  DASHBOARD: '/dashboard',
  REGISTRY_DASHBOARD: '/dashboard/cr',
  //ORGANIZATION
  VIEW_ORGANIZATIONS: '/companyManagement/viewAll',
  VIEW_ORGANIZATION_PROFILE: '/companyProfile/view',
  ADD_ORGANIZATION: '/companyManagement/addCompany',
  UPDATE_ORGANIZATION: '/companyManagement/updateCompany',
  REGISTER_ORGANIZATION: '/companyManagement/registerCompany',
  REGISTER_ORGANIZATION_FROM_LOGIN: '/registerCompany',
  //INVESTMENT
  VIEW_INVESTMENTS: '/investmentManagement/viewAll',
  ADD_INVESTMENT: '/investmentManagement/addInvestment',
  //NDC
  VIEW_NDC: '/ndcManagement/view',
  VIEW_ALL_NDC: '/ndcManagement/viewAll',
  ADD_NDC_ACTION: '/programmeManagement/addNdcAction',
  //SITE-VISIT
  SITE_VISIT_CHECKLIST: (id: string) => `/programmeManagement/siteVisitCheckList/${id}`,
  SITE_VISIT_REPORT_BY_PROGRAMME_ID: (programmeId: string | number) =>
    `/programmeManagement/siteVisitCheckList/${programmeId}`,
  //ADAPTATION
  ADAPTATION_SUBMIT: '/adaptation/submit',
  ADAPTATION_MANAGE: '/adaptation/manage',
  //RESOURCES (CLIMATE FINANCE / EMISSION TRADING)
  CLIMATE_FINANCE_SUBMIT: '/climateFinance/submit',
  EMISSION_TRADING_SUBMIT: '/emissionTrading/submit',
  NDC_TARGET_SUBMIT: '/ndcTarget/submit',
  TECHNOLOGY_TRANSFER_SUBMIT: '/technologyTransfer/submit',
  CAPACITY_BUILDING_SUBMIT: '/capacityBuilding/submit',
  //COMMUNITY CLIMATE PROGRAMS
  COMMUNITY_PROGRAM_SUBMIT: '/communityProgram/submit',
  //SHARED MANAGEMENT
  MANAGEMENT_CERTIFICATE_REGISTRY: '/management/certificate-registry',
  MANAGEMENT_EMISSION_TRADING: '/management/emission-trading',
  MANAGEMENT_ADAPTATION: '/management/adaptation',
  MANAGEMENT_CLIMATE_FINANCE: '/management/climate-finance',
  MANAGEMENT_TECHNOLOGY_TRANSFER: '/management/technology-transfer',
  MANAGEMENT_CAPACITY_BUILDING: '/management/capacity-building',
  MANAGEMENT_COMMUNITY_PROGRAM: '/management/community-program',
  MANAGEMENT_NDC_TARGET: '/management/ndc-target',
  MANAGEMENT_REDD_PLUS: '/management/redd-plus',
  MANAGEMENT_RECOGNIZED_MITIGATION: '/management/recognized-mitigation',
  MANAGEMENT_EXPERT: '/management/expert',
  MANAGEMENT_GUIDANCE_DOCUMENT: '/management/guidance-document',
  MANAGEMENT_METHODOLOGY: '/management/methodology',
};
