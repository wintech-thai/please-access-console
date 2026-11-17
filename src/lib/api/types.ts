export interface UserItem {
  adminUserId: string
  orgUserId?: string | null
  userId: string
  userName: string
  userEmail: string
  tmpUserEmail?: string | null
  userStatus: string
  rolesList?: string | null
  roles?: unknown[]
  customRoleId?: string | null
  customRoleName?: string | null
  customRoleDesc?: string | null
  tags?: string | null
  isOrgInitialUser?: string | null
  createdDate?: string | null
}

export interface GetUsersPayload {
  search?: string
  page?: number
  limit?: number
}

export interface InviteUserPayload {
  UserName: string
  UserEmail: string
}

export interface InviteUserWithLinkPayload {
  userName: string
  userEmail: string
  tmpUserEmail: string
  customRoleId?: string
  CustomRoleId?: string  // PascalCase variant for backends that require it
  Roles?: string[]     // array of role names e.g. ["OWNER", "VIEWER"]
  tags?: string        // comma-separated string
}

export interface UpdateUserPayload {
  name?: string
  lastName?: string
  phoneNumber?: string
  secondaryEmail?: string
  customRoleId?: string
  CustomRoleId?: string
  Roles?: string[]
  tags?: string
}

export interface TenantItem {
  orgId?: string | null
  orgCustomId: string
  orgName?: string | null
  orgDescription?: string | null
  orgType?: string | null
  tags?: string | null
  email?: string | null
  phone?: string | null
  status?: string | null
  orgCreatedDate?: string | null
}

export interface GetTenantsPayload {
  FullTextSearch?: string
  Status?: string
  Offset?: number
  Limit?: number
}

export interface AddTenantPayload {
  OrgCustomId: string
  OrgType?: string
  OrgName?: string
  Email?: string
  Phone?: string
  Tags?: string
  Status?: string
}

export interface UpdateTenantPayload {
  OrgName?: string
  Email?: string
  Phone?: string
  Tags?: string
  Status?: string
}

export interface MVOrganization {
  status?: string
  description?: string
  organization?: TenantItem
}

export interface OrgUserItem {
  orgUserId: string
  userId?: string | null
  userName?: string | null
  userEmail?: string | null
  tmpUserEmail?: string | null
  userStatus?: string | null
  createdDate?: string | null
  invitedDate?: string | null
  tags?: string | null
  rolesList?: string | null
  isOrgInitialUser?: string | null
}

export interface InviteOrgUserPayload {
  UserName: string
  UserEmail: string
}

export interface CompanyProfile {
  orgNameTh?: string | null
  orgNameEn?: string | null
  contactNameTh?: string | null
  contactNameEn?: string | null
  addressTh?: string | null
  addressEn?: string | null
  phone?: string | null
  fax?: string | null
  email?: string | null
  taxId?: string | null
  website?: string | null
  logoImageBase64?: string | null
}

export interface UpdateCompanyProfilePayload {
  OrgNameTh?: string
  OrgNameEn?: string
  ContactNameTh?: string
  ContactNameEn?: string
  AddressTh?: string
  AddressEn?: string
  Phone?: string
  Fax?: string
  Email?: string
  TaxId?: string
  Website?: string
  LogoImageBase64?: string | null
}

// ─── Custom Role ──────────────────────────────────────────────────────────────

export interface PermissionItem {
  controllerName: string
  apiName: string
  isAllowed: boolean
}

export interface ControllerPermissions {
  controllerName: string
  apiPermissions: PermissionItem[]
}

export interface CustomRoleItem {
  roleId: string
  orgId?: string
  roleName: string
  roleDescription?: string
  roleDefinition?: string
  tags?: string
  level?: string
  roleCreatedDate?: string
  permissions?: ControllerPermissions[]
}

export interface GetCustomRolesPayload {
  search?: string
  page?: number
  limit?: number
}

export interface AddCustomRolePayload {
  roleName: string
  roleDescription?: string
  roleDefinition?: string
  tags?: string
  level?: string
  permissions?: ControllerPermissions[]
}

export interface UpdateCustomRolePayload {
  roleName?: string
  roleDescription?: string
  roleDefinition?: string
  tags?: string
  level?: string
  permissions?: ControllerPermissions[]
}

// ─── API Key ─────────────────────────────────────────────────────────────────

export interface ApiKeyItem {
  keyId: string
  apiKey?: string | null
  orgId?: string
  keyName?: string | null
  keyCreatedDate?: string | null
  keyExpiredDate?: string | null
  keyDescription?: string | null
  keyStatus?: string | null
  rolesList?: string | null
  roles?: unknown[]
  customRoleId?: string | null
  customRoleName?: string | null
  customRoleDesc?: string | null
}

export interface GetApiKeysPayload {
  search?: string
  page?: number
  limit?: number
}

export interface AddApiKeyPayload {
  keyName: string
  keyDescription?: string
  customRoleId?: string
  Roles?: string[]
  tags?: string
}

export interface UpdateApiKeyPayload {
  keyName?: string
  keyDescription?: string
  customRoleId?: string
  CustomRoleId?: string
  Roles?: string[]
  tags?: string
}

// ─── Portal Page ─────────────────────────────────────────────────────────────

export interface PortalPageItem {
  portalPageId: string
  orgId?: string | null
  code?: string | null
  authMethod?: string | null
  theme?: string | null
  isDefault?: boolean | null
  isEnabled?: boolean | null
  apiKeyId?: string | null
  apiCode?: string | null
  createdDate?: string | null
}

export interface GetPortalPagesPayload {
  Offset?: number
  Limit?: number
  FullTextSearch?: string
  AuthMethod?: string
  Status?: string
}

export interface AddPortalPagePayload {
  Code: string
  AuthMethod?: string
  Theme?: string
  IsDefault?: boolean
  IsEnabled?: boolean
}

export interface UpdatePortalPagePayload {
  Code: string
  AuthMethod?: string
  Theme?: string
}

export interface PortalSessionItem {
  portalSessionId: string
  orgId?: string | null
  portalPageCode?: string | null
  parametersJson?: string | null
  status?: string | null
  statusDesc?: string | null
  createdDate?: string | null
  loginDate?: string | null
}

export interface GetPortalSessionsPayload {
  Offset?: number
  Limit?: number
  FullTextSearch?: string
  Status?: string
  PortalPageCode?: string
}
