'use client'

import { useState, useEffect } from 'react'
import { Box, Grow, CircularProgress } from '@mui/material'
import NavList from '../../Components/PageNav/NavList'
import { SearchBox } from '../../Components/SearchBox'
import { AddButton } from '../../Components/Buttons/AddButton'
import { Breadcrumbs } from '../../Components/Breadcrumbs'
import { useNavigate } from 'react-router-dom'
import supabaseClient from '../../supabaseClient'
interface Discipline {
  id: string
  name: string
  created_at: string
}

export default function DocumentList() {
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [filteredDisciplines, setFilteredDisciplines] = useState<Discipline[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    async function fetchDisciplines() {
      try {
        const { data, error } = await supabaseClient
          .from('disciplines')
          .select('*')
          .order('name')

        if (error) {
          throw error
        }

        setDisciplines(data || [])
        setFilteredDisciplines(data || [])
      } catch (error) {
        console.error('Error fetching disciplines:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDisciplines()
  }, [])

  const handleSearch = (query: string) => {
    if (query) {
      const filtered = disciplines.filter(discipline =>
        discipline.name.toLowerCase().includes(query.toLowerCase())
      )
      setFilteredDisciplines(filtered)
    } else {
      setFilteredDisciplines(disciplines)
    }
  }

  const handleItemClick = (item: Discipline) => {
    setSelectedId(item.id)
    // You can add navigation here if needed
    // navigate(`/disciplines/${item.id}`)
  }

  const handleDeleteClick = async (id: string | null) => {
    if (!id) return

    try {
      const { error } = await supabaseClient
        .from('disciplines')
        .delete()
        .eq('id', id)

      if (error) throw error

      setDisciplines(disciplines.filter(d => d.id !== id))
      setFilteredDisciplines(filteredDisciplines.filter(d => d.id !== id))
    } catch (error) {
      console.error('Error deleting discipline:', error)
    }
  }

  const navItems = filteredDisciplines.map(discipline => ({
    id: discipline.id,
    title: discipline.name,
    isChecked: false
  }))

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
      <Grow in={true} timeout={500}>
        <Box sx={{ padding: 4 }}>
          {/* Header Section */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
            {/* Breadcrumbs on the left */}
            <Breadcrumbs
              items={[
                { label: 'Home', path: '/' },
                { label: 'Disciplines' },
              ]} />

            {/* SearchBox and AddButton on the right */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <SearchBox onSearch={handleSearch} placeholder="Search disciplines" fullWidth={false} />
              <Box sx={{ marginLeft: 2 }}>
                <AddButton onClick={() => setOpen(true)} />
              </Box>
            </Box>
          </Box>

          {/* NavList Section */}
          <NavList
            items={navItems}
            title="Disciplines"
            onItemClick={handleItemClick}
            onDeleteClick={handleDeleteClick}
            selected={selectedId}
            loading={loading} />
        </Box>
      </Grow>
  )
}

