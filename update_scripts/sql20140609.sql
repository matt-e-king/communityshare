DO $$ 
    BEGIN
        BEGIN
            alter table question add long_answer boolean not null default false;
        EXCEPTION
            WHEN duplicate_column THEN RAISE NOTICE 'column long_answer already exists.';
        END;
    END;
$$
