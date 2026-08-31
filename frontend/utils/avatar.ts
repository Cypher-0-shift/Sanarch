import { ImageSourcePropType } from 'react-native';
import { parseDate } from './date';

export type AvatarCategory = 'kid' | 'adult' | 'senior';
export type AvatarGender = 'male' | 'female';
export type AvatarType =
  | 'kid_boy'
  | 'kid_girl'
  | 'adult_male'
  | 'adult_female'
  | 'senior_male'
  | 'senior_female';

export const AVATAR_IMAGES: Record<AvatarType, ImageSourcePropType> = {
  kid_boy: require('../assets/images/avatars/kid_boy.png'),
  kid_girl: require('../assets/images/avatars/kid_girl.png'),
  adult_male: require('../assets/images/avatars/adult_male.png'),
  adult_female: require('../assets/images/avatars/adult_female.png'),
  senior_male: require('../assets/images/avatars/senior_male.png'),
  senior_female: require('../assets/images/avatars/senior_female.png'),
};

export interface AvatarOption {
  id: AvatarType;
  label: string;
  category: AvatarCategory;
  gender: AvatarGender;
  ageRange: string;
  source: ImageSourcePropType;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  {
    id: 'kid_boy',
    label: 'Boy (Kid)',
    category: 'kid',
    gender: 'male',
    ageRange: '< 13 yrs',
    source: AVATAR_IMAGES.kid_boy,
  },
  {
    id: 'kid_girl',
    label: 'Girl (Kid)',
    category: 'kid',
    gender: 'female',
    ageRange: '< 13 yrs',
    source: AVATAR_IMAGES.kid_girl,
  },
  {
    id: 'adult_male',
    label: 'Young Male',
    category: 'adult',
    gender: 'male',
    ageRange: '13–59 yrs',
    source: AVATAR_IMAGES.adult_male,
  },
  {
    id: 'adult_female',
    label: 'Young Female',
    category: 'adult',
    gender: 'female',
    ageRange: '13–59 yrs',
    source: AVATAR_IMAGES.adult_female,
  },
  {
    id: 'senior_male',
    label: 'Senior Male',
    category: 'senior',
    gender: 'male',
    ageRange: '60+ yrs',
    source: AVATAR_IMAGES.senior_male,
  },
  {
    id: 'senior_female',
    label: 'Senior Female',
    category: 'senior',
    gender: 'female',
    ageRange: '60+ yrs',
    source: AVATAR_IMAGES.senior_female,
  },
];

export interface AvatarDetectionParams {
  name?: string | null;
  gender?: string | null;
  dob?: string | null;
  age?: number | null;
  relation?: string | null;
  avatarType?: AvatarType | string | null;
}

/**
 * Automatically determine the most accurate avatar among the 6 avatars
 * based on gender, date of birth / age, and familial relationship.
 */
export function getAvatarType(params: AvatarDetectionParams): AvatarType {
  if (params.avatarType && params.avatarType in AVATAR_IMAGES) {
    return params.avatarType as AvatarType;
  }

  // 1. Calculate age if DOB provided
  let calculatedAge: number | null = params.age ?? null;
  if (calculatedAge === null && params.dob) {
    const birth = parseDate(params.dob);
    if (birth) {
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      calculatedAge = age >= 0 ? age : null;
    }
  }

  // 2. Determine Gender
  const cleanGender = (params.gender || '').trim().toLowerCase();
  const cleanRelation = (params.relation || '').trim().toLowerCase();

  const isFemale =
    cleanGender === 'female' ||
    cleanGender === 'f' ||
    cleanGender === 'girl' ||
    cleanGender === 'woman' ||
    ['daughter', 'mother', 'wife', 'sister', 'grandmother', 'grandma', 'aunt'].includes(cleanRelation);

  // 3. Determine Age Group (kid, adult, senior)
  let category: AvatarCategory = 'adult';

  if (calculatedAge !== null) {
    if (calculatedAge < 13) {
      category = 'kid';
    } else if (calculatedAge >= 60) {
      category = 'senior';
    } else {
      category = 'adult';
    }
  } else {
    // Fallback to relation hints if age is not available
    if (['son', 'daughter', 'child', 'kid', 'baby', 'infant'].includes(cleanRelation)) {
      category = 'kid';
    } else if (
      ['father', 'mother', 'parent', 'grandfather', 'grandmother', 'grandpa', 'grandma', 'senior'].includes(
        cleanRelation
      )
    ) {
      category = 'senior';
    } else {
      category = 'adult';
    }
  }

  // 4. Return matching avatar
  if (category === 'kid') {
    return isFemale ? 'kid_girl' : 'kid_boy';
  }
  if (category === 'senior') {
    return isFemale ? 'senior_female' : 'senior_male';
  }
  return isFemale ? 'adult_female' : 'adult_male';
}

/**
 * Returns the resolved React Native image source for a given profile or user object.
 */
export function getAvatarSource(params: AvatarDetectionParams): ImageSourcePropType {
  const avatarType = getAvatarType(params);
  return AVATAR_IMAGES[avatarType];
}
