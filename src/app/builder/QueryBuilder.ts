// import { FilterQuery, Query } from 'mongoose';

// class QueryBuilder<T> {
//   public modelQuery: Query<T[], T>;
//   public query: Record<string, unknown>;

//   constructor(modelQuery: Query<T[], T>, query: Record<string, unknown>) {
//     this.modelQuery = modelQuery;
//     this.query = query;
//   }

//   //searching
//   search(searchableFields: string[]) {
//     if (this?.query?.searchTerm) {
//       this.modelQuery = this.modelQuery.find({
//         $or: searchableFields.map(
//           field =>
//             ({
//               [field]: {
//                 $regex: this.query.searchTerm,
//                 $options: 'i',
//               },
//             }) as FilterQuery<T>,
//         ),
//       });
//     }
//     return this;
//   }

//   //filtering
//   filter() {
//     const queryObj = { ...this.query };
//     const excludeFields = ['searchTerm', 'sort', 'page', 'limit', 'fields'];
//     excludeFields.forEach(el => delete queryObj[el]);

//     this.modelQuery = this.modelQuery.find(queryObj as FilterQuery<T>);
//     return this;
//   }

//   //sorting
//   sort() {
//     let sort = (this?.query?.sort as string) || '-createdAt';
//     this.modelQuery = this.modelQuery.sort(sort);

//     return this;
//   }

//   //pagination
//   paginate() {
//     let limit = Number(this?.query?.limit) || 10;
//     let page = Number(this?.query?.page) || 1;
//     let skip = (page - 1) * limit;

//     this.modelQuery = this.modelQuery.skip(skip).limit(limit);

//     return this;
//   }

//   //fields filtering
//   fields() {
//     let fields =
//       (this?.query?.fields as string)?.split(',').join(' ') || '-__v';
//     this.modelQuery = this.modelQuery.select(fields);

//     return this;
//   }

//   //populating
//   populate(populateFields: string[], selectFields: Record<string, unknown>) {
//     this.modelQuery = this.modelQuery.populate(
//       populateFields.map(field => ({
//         path: field,
//         select: selectFields[field],
//       })),
//     );
//     return this;
//   }

//   //pagination information
//   async getPaginationInfo() {
//     const total = await this.modelQuery.model.countDocuments(
//       this.modelQuery.getFilter(),
//     );
//     const limit = Number(this?.query?.limit) || 10;
//     const page = Number(this?.query?.page) || 1;
//     const totalPage = Math.ceil(total / limit);

//     return {
//       total,
//       limit,
//       page,
//       totalPage,
//     };
//   }
// }

// export default QueryBuilder;



import { FilterQuery, Query } from 'mongoose';

class QueryBuilder<T> {
  public modelQuery: any;
  public query: Record<string, any>;

  constructor(modelQuery: Query<T[], T> | T[], query: Record<string, any>) {
    this.modelQuery = modelQuery;
    this.query = query;
  }

  // Searching
  search(searchableFields: string[]) {
    if (this.query?.searchTerm) {
      const term = this.query.searchTerm.toLowerCase();

      if (Array.isArray(this.modelQuery)) {
        this.modelQuery = this.modelQuery.filter(item =>
          searchableFields.some(field =>
            String(item[field])?.toLowerCase().includes(term)
          )
        );
      } else {
        this.modelQuery = this.modelQuery.find({
          $or: searchableFields.map(field => ({
            [field]: {
              $regex: term,
              $options: 'i',
            },
          })),
        });
      }
    }
    return this;
  }

  // Filtering
  filter() {
    const queryObj = { ...this.query };
    const excludeFields = ['searchTerm', 'sort', 'page', 'limit', 'fields'];
    excludeFields.forEach(el => delete queryObj[el]);

    if (Array.isArray(this.modelQuery)) {
      this.modelQuery = this.modelQuery.filter(item =>
        Object.entries(queryObj).every(([key, value]) =>
          String(item[key])?.toLowerCase().includes(String(value).toLowerCase())
        )
      );
    } else {
      this.modelQuery = this.modelQuery.find(queryObj as FilterQuery<T>);
    }

    return this;
  }

  // Sorting
  sort() {
    const sort = (this.query?.sort as string) || '-createdAt';

    if (!Array.isArray(this.modelQuery)) {
      this.modelQuery = this.modelQuery.sort(sort);
    }
    return this;
  }

  // Pagination
  paginate() {
    const limit = Number(this.query?.limit) || 10;
    const page = Number(this.query?.page) || 1;
    const skip = (page - 1) * limit;

    if (Array.isArray(this.modelQuery)) {
      this.modelQuery = this.modelQuery.slice(skip, skip + limit);
    } else {
      this.modelQuery = this.modelQuery.skip(skip).limit(limit);
    }

    return this;
  }

  // Fields Selection
  fields() {
    const fields =
      (this.query?.fields as string)?.split(',').join(' ') || '-__v';

    if (!Array.isArray(this.modelQuery)) {
      this.modelQuery = this.modelQuery.select(fields);
    }

    return this;
  }

  // Population
  populate(populateFields: string[], selectFields: Record<string, unknown>) {
    if (!Array.isArray(this.modelQuery)) {
      this.modelQuery = this.modelQuery.populate(
        populateFields.map(field => ({
          path: field,
          select: selectFields[field],
        }))
      );
    }

    return this;
  }

  // Pagination Meta Info
  async getPaginationInfo() {
    let total = 0;

    if (Array.isArray(this.modelQuery)) {
      total = this.modelQuery.length;
    } else {
      total = await this.modelQuery.model.countDocuments(
        this.modelQuery.getFilter()
      );
    }

    const limit = Number(this.query?.limit) || 10;
    const page = Number(this.query?.page) || 1;
    const totalPage = Math.ceil(total / limit);

    return {
      total,
      limit,
      page,
      totalPage,
    };
  }
}

export default QueryBuilder;

