import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePersonTable1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE persons (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_number VARCHAR UNIQUE,
        first_name    VARCHAR NOT NULL,
        last_name     VARCHAR NOT NULL,
        birth_date    DATE,
        sex           VARCHAR,
        children_count INTEGER CHECK (children_count >= 0),
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE persons`);
  }
}
