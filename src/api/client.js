import { supabase } from './supabase.js';

// Entity name (PascalCase) → Supabase table name (snake_case plural)
// 'Announcement' → 'announcements'
// 'TemplateCategory' → 'template_categories'
const entityToTable = (name) => {
  if (name === 'User') return 'profiles';
  const snake = name.replace(/([A-Z])/g, (m, c, i) => i === 0 ? c.toLowerCase() : '_' + c.toLowerCase());
  if (snake.endsWith('y')) return snake.slice(0, -1) + 'ies';
  return snake.endsWith('s') ? snake : snake + 's';
};

// '-created_date' → { column: 'created_at', ascending: false }
const parseSort = (sortStr) => {
  if (!sortStr) return { column: 'created_at', ascending: false };
  const desc = sortStr.startsWith('-');
  const raw = desc ? sortStr.slice(1) : sortStr;
  const column = raw
    .replace('created_date', 'created_at')
    .replace('updated_date', 'updated_at');
  return { column, ascending: !desc };
};

const createEntityClient = (entityName) => {
  const table = entityToTable(entityName);

  return {
    // list(sort, limit, skip)
    list: async (sort, limit = 100, skip = 0) => {
      const { column, ascending } = parseSort(sort);
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order(column, { ascending })
        .range(skip, skip + parseInt(limit) - 1);
      if (error) throw error;
      return data;
    },

    // get(id)
    get: async (id) => {
      const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },

    // create(data)
    create: async (data) => {
      const { data: row, error } = await supabase.from(table).insert(data).select().single();
      if (error) throw error;
      return row;
    },

    // update(id, data)
    update: async (id, data) => {
      const { data: row, error } = await supabase.from(table).update(data).eq('id', id).select().single();
      if (error) throw error;
      return row;
    },

    // delete(id)
    delete: async (id) => {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },

    // filter(query, sort, limit, skip)
    filter: async (query = {}, sort, limit = 100, skip = 0) => {
      const { column, ascending } = parseSort(sort);
      let q = supabase.from(table).select('*');
      Object.entries(query).forEach(([k, v]) => { q = q.eq(k, v); });
      const { data, error } = await q
        .order(column, { ascending })
        .range(skip, skip + parseInt(limit) - 1);
      if (error) throw error;
      return data;
    },
  };
};

export const apiClient = {
  auth: {
    me: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) throw { status: 401, message: 'Not authenticated' };
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      return { ...profile, id: user.id, email: user.email };
    },

    updateMe: async (data) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw { status: 401 };
      const { data: profile, error } = await supabase
        .from('profiles').update(data).eq('id', user.id).select().single();
      if (error) throw error;
      return profile;
    },

    login: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw { message: error.message };
      return data;
    },

    register: async ({ email, password, synagogue_name = '', synagogue_city = '', plan = 'free', referred_by = '' }) => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw { message: error.message };
      if (data.user) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          email,
          synagogue_name,
          synagogue_city,
          plan,
          referred_by: referred_by || null,
          credits: 10,
        });
        // If referred, give referrer 2 credits
        if (referred_by) {
          const { data: referrer } = await supabase
            .from('profiles')
            .select('id, credits, credits_from_referrals, referral_signups')
            .eq('referral_code', referred_by)
            .single();
          if (referrer) {
            await supabase.from('profiles').update({
              credits: (referrer.credits || 0) + 2,
              credits_from_referrals: (referrer.credits_from_referrals || 0) + 2,
              referral_signups: (referrer.referral_signups || 0) + 1,
            }).eq('id', referrer.id);
          }
        }
      }
      return data;
    },

    logout: async () => {
      await supabase.auth.signOut();
      window.location.href = '/login';
    },

    redirectToLogin: (returnUrl) => {
      window.location.href = `/login?returnUrl=${encodeURIComponent(returnUrl || '/')}`;
    },

    isAuthenticated: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session;
    },
  },

  entities: new Proxy({}, {
    get: (_, entityName) => {
      if (typeof entityName !== 'string' || entityName === 'then' || entityName.startsWith('_')) return undefined;
      return createEntityClient(entityName);
    },
  }),

  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        const { data: { user } } = await supabase.auth.getUser();
        const ext = file.name.split('.').pop();
        const path = `${user?.id || 'public'}/${Date.now()}.${ext}`;
        const { data, error } = await supabase.storage.from('uploads').upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(data.path);
        return { file_url: publicUrl };
      },

      InvokeLLM: async (params) => {
        const { data, error } = await supabase.functions.invoke('ai-generat', { body: params });
        if (error) throw error;
        return data;
      },
    },
  },

  functions: {
    invoke: async (name, params) => {
      const { data, error } = await supabase.functions.invoke(name, { body: params });
      if (error) throw error;
      return { data };
    },
  },
};
