-- Drop the recursive policies
DROP POLICY IF EXISTS "Admins and Reviewers can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;

-- Replace with simpler, non-recursive policies
-- 1. Everyone can read their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING ( auth.uid() = id );

-- 2. Instead of querying the same table, allow reading if the auth.jwt() has role claims
-- OR allow all authenticated users to read profiles (safer and no recursion)
CREATE POLICY "Authenticated users can read all profiles" ON public.profiles
  FOR SELECT USING ( auth.role() = 'authenticated' );
