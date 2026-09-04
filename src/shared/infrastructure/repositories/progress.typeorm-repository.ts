import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type {
  ProgressRecord,
  ProgressRepository,
} from '../../domain/repositories/progress.repository.js';

interface ProgressRawRow {
  evaluationDate: string;
  weightKg: string | null;
  bodyFatPercentage: string | null;
  muscleMassPercentage: string | null;
  waist: string | null;
}

@Injectable()
export class ProgressTypeOrmRepository implements ProgressRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findProgressByPersonId(personId: string): Promise<ProgressRecord[]> {
    const rows: ProgressRawRow[] = await this.dataSource.query(
      `
      SELECT
        e.evaluation_date         AS "evaluationDate",
        bc.weight_kg              AS "weightKg",
        bc.body_fat_percentage    AS "bodyFatPercentage",
        bc.muscle_mass_percentage AS "muscleMassPercentage",
        em.value                  AS "waist"
      FROM evaluations e
      LEFT JOIN body_compositions bc ON bc.evaluation_id = e.id
      LEFT JOIN evaluation_measurements em
        ON em.evaluation_id = e.id
        AND em.measurement_type_id = (
          SELECT id FROM measurement_types WHERE code = 'WAIST' LIMIT 1
        )
      WHERE e.person_id = $1
      ORDER BY e.evaluation_date ASC
      `,
      [personId],
    );

    return rows.map((row) => ({
      evaluationDate: new Date(row.evaluationDate),
      weightKg: row.weightKg !== null ? Number(row.weightKg) : null,
      bodyFatPercentage:
        row.bodyFatPercentage !== null ? Number(row.bodyFatPercentage) : null,
      muscleMassPercentage:
        row.muscleMassPercentage !== null
          ? Number(row.muscleMassPercentage)
          : null,
      waist: row.waist !== null ? Number(row.waist) : null,
    }));
  }
}
