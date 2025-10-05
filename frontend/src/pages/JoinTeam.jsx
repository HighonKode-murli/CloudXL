import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Users, CheckCircle, XCircle, Loader } from 'lucide-react'
import { joinTeam, clearError } from '../store/teamsSlice'

const JoinTeam = () => {
  const { token: pathToken } = useParams()
  const [searchParams] = useSearchParams()
  const queryToken = searchParams.get('token')
  const token = queryToken || pathToken // Support both query param and path param
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { loading, error } = useSelector((state) => state.teams)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (token) {
      handleJoinTeam()
    }
  }, [token])

  const handleJoinTeam = async () => {
    try {
      await dispatch(joinTeam(token)).unwrap()
      setSuccess(true)
      setTimeout(() => {
        navigate('/teams')
      }, 2000)
    } catch (error) {
      console.error('Failed to join team:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {loading ? (
              <>
                <Loader className="mx-auto h-12 w-12 text-indigo-600 animate-spin" />
                <h2 className="mt-4 text-xl font-semibold text-gray-900">
                  Joining team...
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Please wait while we process your invitation
                </p>
              </>
            ) : success ? (
              <>
                <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
                <h2 className="mt-4 text-xl font-semibold text-gray-900">
                  Successfully joined team!
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Redirecting you to teams page...
                </p>
              </>
            ) : error ? (
              <>
                <XCircle className="mx-auto h-12 w-12 text-red-600" />
                <h2 className="mt-4 text-xl font-semibold text-gray-900">
                  Failed to join team
                </h2>
                <p className="mt-2 text-sm text-red-600">{error}</p>
                <div className="mt-6 space-y-3">
                  <button
                    onClick={handleJoinTeam}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => navigate('/teams')}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Go to Teams
                  </button>
                </div>
              </>
            ) : (
              <>
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h2 className="mt-4 text-xl font-semibold text-gray-900">
                  Invalid invitation
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  This invitation link is not valid
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default JoinTeam
