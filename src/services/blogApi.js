import api from './api';

/**
 * Helper to build FormData from object
 */
function buildBlogFormData(data) {
  if (data instanceof FormData) return data;
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (key === 'blog_banner_image') {
        if (value instanceof File || value instanceof Blob) {
          formData.append('blog_banner_image', value);
        }
      } else {
        formData.append(key, String(value));
      }
    }
  });

  return formData;
}

/**
 * 1. GET /blog
 * Fetch blog list with pagination, search, status filters
 */
export const getBlogs = async (params = {}) => {
  const queryParams = typeof params === 'number' ? { page: params } : params;
  const response = await api.get('/blog', { params: queryParams });
  return response.data;
};

/**
 * 2. POST /blog
 * Create new blog
 */
export const createBlog = async (payload) => {
  const formData = buildBlogFormData(payload);
  const response = await api.post('/blog', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

/**
 * 3. GET /blog/{id}
 * Fetch single blog by ID
 */
export const getBlogById = async (id) => {
  const response = await api.get(`/blog/${id}`);
  return response.data;
};

/**
 * 4. PUT /blog/{id}
 * Update blog by ID (Using POST with _method='PUT' for Laravel multipart support)
 */
export const updateBlog = async (id, payload) => {
  const formData = buildBlogFormData(payload);
  if (!formData.has('_method')) {
    formData.append('_method', 'PUT');
  }

  try {
    const response = await api.post(`/blog/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (err) {
    // Fallback direct PUT request
    const response = await api.put(`/blog/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }
};

/**
 * 5. PATCH /blogs/{id}/status
 * Toggle or update blog status (Active / Inactive)
 */
export const updateBlogStatus = async (id, blog_status) => {
  const statusVal = String(blog_status || 'Active').trim();
  const formData = new FormData();
  formData.append('blog_status', statusVal);

  try {
    const response = await api.patch(`/blogs/${id}/status`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (err) {
    const response = await api.patch(`/blogs/${id}/status`, {
      blog_status: statusVal,
    });
    return response.data;
  }
};

/**
 * 6. DELETE /blog/{id}
 * Delete blog by ID
 */
export const deleteBlog = async (id) => {
  const response = await api.delete(`/blog/${id}`);
  return response.data;
};

export default {
  getBlogs,
  createBlog,
  getBlogById,
  updateBlog,
  updateBlogStatus,
  deleteBlog,
};
