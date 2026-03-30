import api from './axios'

export const updateProfile = (data) => api.put('/user/profile', data)

export const uploadAvatar = (formData) =>
  api.post('/user/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const deleteAccount = () => api.delete('/user/account')
