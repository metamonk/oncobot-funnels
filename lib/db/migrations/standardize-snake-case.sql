-- Migration to standardize all database fields to snake_case
-- This ensures consistency across the entire codebase

-- Step 1: Rename camelCase columns in chat table
ALTER TABLE chat 
  RENAME COLUMN "userId" TO user_id;

-- Step 2: Rename camelCase columns in stream table  
ALTER TABLE stream
  RENAME COLUMN "chatId" TO chat_id,
  RENAME COLUMN "createdAt" TO created_at;

-- Step 3: Rename camelCase columns in account table
ALTER TABLE account
  RENAME COLUMN "accountId" TO account_id,
  RENAME COLUMN "providerId" TO provider_id,
  RENAME COLUMN "accessToken" TO access_token,
  RENAME COLUMN "refreshToken" TO refresh_token,
  RENAME COLUMN "idToken" TO id_token,
  RENAME COLUMN "accessTokenExpiresAt" TO access_token_expires_at,
  RENAME COLUMN "refreshTokenExpiresAt" TO refresh_token_expires_at;

-- Step 4: Rename camelCase columns in health_profile table
ALTER TABLE health_profile
  RENAME COLUMN "cancerRegion" TO cancer_region,
  RENAME COLUMN "primarySite" TO primary_site, 
  RENAME COLUMN "cancerType" TO cancer_type,
  RENAME COLUMN "diseaseStage" TO disease_stage,
  RENAME COLUMN "dateOfBirth" TO date_of_birth,
  RENAME COLUMN "treatmentHistory" TO treatment_history,
  RENAME COLUMN "molecularMarkers" TO molecular_markers,
  RENAME COLUMN "performanceStatus" TO performance_status,
  RENAME COLUMN "completedAt" TO completed_at,
  RENAME COLUMN "questionnaireVersion" TO questionnaire_version,
  RENAME COLUMN "createdAt" TO created_at,
  RENAME COLUMN "updatedAt" TO updated_at;

-- Step 5: Rename camelCase columns in user_health_profile table
ALTER TABLE user_health_profile
  RENAME COLUMN "userId" TO user_id,
  RENAME COLUMN "healthProfileId" TO health_profile_id,
  RENAME COLUMN "isActive" TO is_active,
  RENAME COLUMN "createdAt" TO created_at,
  RENAME COLUMN "updatedAt" TO updated_at;

-- Step 6: Rename camelCase columns in health_profile_response table
ALTER TABLE health_profile_response
  RENAME COLUMN "healthProfileId" TO health_profile_id,
  RENAME COLUMN "questionId" TO question_id,
  RENAME COLUMN "createdAt" TO created_at;

-- Step 7: Rename camelCase columns in custom_instructions table
ALTER TABLE custom_instructions
  RENAME COLUMN "userId" TO user_id,
  RENAME COLUMN "createdAt" TO created_at,
  RENAME COLUMN "updatedAt" TO updated_at;

-- Step 8: Rename camelCase columns in user table
ALTER TABLE "user"
  RENAME COLUMN "emailVerified" TO email_verified,
  RENAME COLUMN "createdAt" TO created_at,
  RENAME COLUMN "updatedAt" TO updated_at;

-- Step 9: Rename camelCase columns in session table
ALTER TABLE session
  RENAME COLUMN "expiresAt" TO expires_at,
  RENAME COLUMN "createdAt" TO created_at,
  RENAME COLUMN "updatedAt" TO updated_at,
  RENAME COLUMN "ipAddress" TO ip_address,
  RENAME COLUMN "userAgent" TO user_agent,
  RENAME COLUMN "userId" TO user_id;

-- Step 10: Rename camelCase columns in message table
ALTER TABLE message
  RENAME COLUMN "chatId" TO chat_id,
  RENAME COLUMN "createdAt" TO created_at;