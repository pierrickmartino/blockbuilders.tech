-- Ensure all users include simulationOnly consent metadata scaffold.
UPDATE auth.users
SET app_metadata = coalesce(app_metadata, '{}'::jsonb)
  || jsonb_build_object(
    'consents',
    coalesce(app_metadata -> 'consents', '{}'::jsonb)
      || jsonb_build_object(
        'simulationOnly',
        jsonb_build_object(
          'acknowledged', false,
          'acknowledgedAt', NULL
        )
      )
  )
WHERE (app_metadata -> 'consents' -> 'simulationOnly') IS NULL;
