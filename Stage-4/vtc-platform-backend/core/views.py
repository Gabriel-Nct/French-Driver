from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Simple view to verify that the API is working
    """
    return Response({
        'success': True,
        'message': 'VTC Platform API is running!',
        'version': '1.0.0'
    }, status=status.HTTP_200_OK)
