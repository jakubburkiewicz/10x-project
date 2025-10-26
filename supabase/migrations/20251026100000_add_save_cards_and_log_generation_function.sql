-- migration_meta:
--   - purpose: create a stored procedure for saving cards and logging generation
--   - tables_affected:
--     - public.cards
--     - public.ai_generations
--   - special_notes: this function is called via rpc from the client

create or replace function public.save_cards_and_log_generation(
    cards_to_insert jsonb,
    generation_log jsonb
)
returns setof public.cards as $$
declare
    inserted_card public.cards;
    card_data jsonb;
begin
    -- insert into ai_generations table
    insert into public.ai_generations (user_id, input_text, generated_count, accepted_count)
    values (
        (generation_log->>'user_id')::uuid,
        generation_log->>'input_text',
        (generation_log->>'generated_count')::integer,
        (generation_log->>'accepted_count')::integer
    );

    -- insert into cards table and return the inserted rows
    for card_data in select * from jsonb_array_elements(cards_to_insert)
    loop
        insert into public.cards (user_id, front, back, source)
        values (
            (card_data->>'user_id')::uuid,
            card_data->>'front',
            card_data->>'back',
            card_data->>'source'
        )
        returning * into inserted_card;
        return next inserted_card;
    end loop;

end;
$$ language plpgsql;
