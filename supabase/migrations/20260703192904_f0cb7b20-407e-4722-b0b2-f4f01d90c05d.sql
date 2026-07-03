
CREATE TABLE public.founding_seats (
  n INTEGER PRIMARY KEY CHECK (n BETWEEN 1 AND 10),
  credits INTEGER NOT NULL,
  mins INTEGER NOT NULL,
  taken BOOLEAN NOT NULL DEFAULT false,
  taken_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.founding_seats TO anon;
GRANT SELECT ON public.founding_seats TO authenticated;
GRANT ALL ON public.founding_seats TO service_role;

ALTER TABLE public.founding_seats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view founding seats"
  ON public.founding_seats
  FOR SELECT
  TO anon, authenticated
  USING (true);

INSERT INTO public.founding_seats (n, credits, mins, taken) VALUES
  (1, 600, 40, false),
  (2, 540, 36, false),
  (3, 495, 33, false),
  (4, 450, 30, false),
  (5, 420, 28, false),
  (6, 390, 26, false),
  (7, 360, 24, false),
  (8, 330, 22, false),
  (9, 315, 21, false),
  (10, 300, 20, false);

ALTER PUBLICATION supabase_realtime ADD TABLE public.founding_seats;
ALTER TABLE public.founding_seats REPLICA IDENTITY FULL;
