import { StatusCodes } from 'http-status-codes';
import { FilterQuery, Query } from 'mongoose';
import ApiError from '../../errors/ApiError';

class QueryBuilder<T> {
  public modelQuery: Query<T[], T>;
  public query: Record<string, unknown>;

  constructor(modelQuery: Query<T[], T>, query: Record<string, unknown>) {
    this.modelQuery = modelQuery;
    this.query = query;
  }

  search(searchableFields: string[]) {
    const searchTerm = this.query?.searchTerm as string;
    if (searchTerm) {
      this.modelQuery = this.modelQuery.find({
        $or: searchableFields.map(
          (field) =>
            ({
              [field]: { $regex: searchTerm, $options: 'i' },
            }) as FilterQuery<T>,
        ),
      });
    }
    return this;
  }

  filter() {
    const excludeFields = ['searchTerm', 'sort', 'limit', 'page', 'fields'];
    const queryObj = { ...this.query };
    excludeFields.forEach((el) => delete queryObj[el]);

    this.modelQuery = this.modelQuery.find(queryObj as FilterQuery<T>);
    return this;
  }

  sort() {
    const sort = (this.query?.sort as string)?.split(',')?.join(' ') || '-createdAt';
    this.modelQuery = this.modelQuery.sort(sort as string);
    return this;
  }

  paginate(defaultLimit = 10) {
    const page = Number(this.query?.page) || 1;
    const limit = Number(this.query?.limit) || defaultLimit;
    const skip = (page - 1) * limit;

    this.modelQuery = this.modelQuery.skip(skip).limit(limit).sort();
    return this;
  }

  fields() {
    const fields = (this.query?.fields as string)?.split(',')?.join(' ') || '-__v';
    this.modelQuery = this.modelQuery.select(fields);
    return this;
  }
  priceRange() {
    const priceFilter: Record<string, unknown> = {};
    const minPrice = this.query?.minPrice as number;
    const maxPrice = this.query?.maxPrice as number;
    if (minPrice !== undefined) priceFilter.$gte = minPrice;
    if (maxPrice !== undefined) priceFilter.$lte = maxPrice;

    if (minPrice !== undefined || maxPrice !== undefined) {
      this.modelQuery = this.modelQuery.find({
        price: priceFilter,
      } as FilterQuery<T>);
    }

    return this;
  }
  async countTotal() {
    try {
      const totalQueries = this.modelQuery.getFilter();
      const total = await this.modelQuery.model.countDocuments(totalQueries);
      const page = Number(this.query?.page) || 1;
      const limit = Number(this.query?.limit) || 10;
      const totalPage = Math.ceil(total / limit);

      return { page, limit, total, totalPage };
    } catch (error) {
      throw new ApiError(StatusCodes.SERVICE_UNAVAILABLE, error as string);
    }
  }
}


export default QueryBuilder;
