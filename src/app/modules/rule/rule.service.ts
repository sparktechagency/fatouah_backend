import { IRule } from './rule.interface';
import { Rule } from './rule.model';

const createPrivacyPolicyToDB = async (payload: IRule) => {
  // check if privacy policy exists
  const isExistPrivacy = await Rule.findOne({ type: 'privacy' });

  if (isExistPrivacy) {
    // if privacy policy is already exists than update the privacy policy
    const result = await Rule.findOneAndUpdate(
      { type: 'privacy' },
      { content: payload?.content },
      { new: true },
    );

    return result;
  } else {
    // create new  privacy policy if not exist
    const result = await Rule.create({ ...payload, type: 'privacy' });
    return result;
  }
};

const getPrivacyPolicyFromDB = async () => {
  const result = await Rule.findOne({ type: 'privacy' });
  
  return result;
};

const createTermsAndConditionToDB = async (payload: IRule) => {
  // check if terms and conditions is exists
  const isExistTerms = await Rule.findOne({ type: 'terms' });
  if (isExistTerms) {
    const result = await Rule.findOneAndUpdate(
      { type: 'terms' },
      { content: payload?.content },
      { new: true },
    );
    return result;
  } else {
    // create new terms and condition if not exist
    const result = await Rule.create({ ...payload, type: 'terms' });
    return result;
  }
};

const getTermsAndConditionFromDB = async () => {
  const result = await Rule.findOne({ type: 'terms' });
  
  return result;
};

const createAboutToDB = async (payload: IRule) => {
  // check if about is exists
  const isExistAbout = await Rule.findOne({ type: 'about' });

  if (isExistAbout) {
    const result = await Rule.findOneAndUpdate(
      { type: 'about' },
      { content: payload.content },
      { new: true },
    );
    return result;
  } else {
    // create a new about if not exist
    const result = await Rule.create({ ...payload, type: 'about' });
    return result;
  }
};

const getAboutFromDB = async () => {
  const result = await Rule.findOne({ type: 'about' });
  
  return result;
};

export const RuleServices = {
  createPrivacyPolicyToDB,
  getPrivacyPolicyFromDB,
  createTermsAndConditionToDB,
  getTermsAndConditionFromDB,
  createAboutToDB,
  getAboutFromDB,
};
