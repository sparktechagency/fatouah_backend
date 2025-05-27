import { model, Schema } from 'mongoose';
import { IRule } from './rule.interface';

const ruleSchema = new Schema<IRule>(
  {
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['privacy', 'terms', 'about'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Rule = model('Rule', ruleSchema);
