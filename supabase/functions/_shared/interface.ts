import { IdAndVersion } from "../_core/src/data/id.ts"
import { DataComponent } from "../_core/src/data/interface.ts"


/**
 * Used for fetching minimal data about data components from the database that
 * is needed to compute the recursive_dependency_ids of a data component.
 */
export type PartialDataComponent = Pick<DataComponent, "id" | "value_type" | "recursive_dependency_ids">


export type GetPartialDataComponentsByIdAndVersion = (id_and_versions: IdAndVersion[]) => Promise<PartialDataComponent[]>
